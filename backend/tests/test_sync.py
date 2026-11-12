from app import main
from conftest import auth, make_event, push, register


async def xp(client, token):
    return (await client.get("/v1/progress/summary", headers=auth(token))).json()["xp"]


async def test_event_accepted_then_duplicate_without_double_counting(client):
    token = await register(client)
    event = make_event("e1")
    first = await push(client, token, [event])
    assert first["accepted"] == ["e1"] and first["duplicates"] == []
    second = await push(client, token, [event])
    assert second["accepted"] == [] and second["duplicates"] == ["e1"]
    items = (await client.get("/v1/progress/items", headers=auth(token))).json()
    assert len(items) == 1 and items[0]["attempts"] == 1


async def test_same_event_id_in_one_batch_counts_once(client):
    token = await register(client)
    result = await push(client, token, [make_event("dup"), make_event("dup")])
    assert result["accepted"] == ["dup"] and result["duplicates"] == ["dup"]
    items = (await client.get("/v1/progress/items", headers=auth(token))).json()
    assert items[0]["attempts"] == 1


async def test_invalid_events_are_rejected_individually(client):
    token = await register(client)
    events = [
        make_event("ok-1"),
        make_event("bad-type", event_type="hack-the-planet"),
        make_event("bad-scope", item_scope="everything"),
        make_event("future", occurred_at="2999-01-01T00:00:00Z"),
        make_event("ancient", occurred_at="1999-01-01T00:00:00Z"),
        make_event("bad-unit", event_type="unit-started", item_scope=None, item_id=None, unit_id="u99-nope"),
        make_event("no-unit", event_type="unit-started", item_scope=None, item_id=None),
        make_event("no-item", item_id=None),
        make_event("big", payload={"x": "a" * 20000}),
        {"client_event_id": "garbled", "event_type": "review-rated", "occurred_at": "not a date"},
        make_event("ok-2"),
    ]
    result = await push(client, token, events)
    assert result["accepted"] == ["ok-1", "ok-2"]
    rejected = {r["clientEventId"]: r["reason"] for r in result["rejected"]}
    assert set(rejected) == {"bad-type", "bad-scope", "future", "ancient", "bad-unit", "no-unit", "no-item", "big", "garbled"}


async def test_database_error_does_not_poison_batch(client):
    token = await register(client)
    poison = make_event("poison", payload={"note": "\u0000"})  # PostgreSQL jsonb rejects NUL
    result = await push(client, token, [make_event("a"), poison, make_event("b", item_id="2")])
    assert result["accepted"] == ["a", "b"]
    assert [r["clientEventId"] for r in result["rejected"]] == ["poison"]
    assert "reason" in result["rejected"][0] and "NUL" not in result["rejected"][0]["reason"]


async def test_naive_timestamps_are_treated_as_utc(client):
    token = await register(client)
    result = await push(client, token, [make_event("naive", occurred_at="2026-11-10T12:00:00")])
    assert result["accepted"] == ["naive"]


async def test_unit_progress_and_checkpoint(client):
    token = await register(client)
    events = [
        make_event("u-start", "unit-started", item_scope=None, item_id=None, unit_id="u02-greetings-introductions", payload={}),
        make_event("u-check", "checkpoint-answer", item_scope=None, item_id=None, unit_id="u02-greetings-introductions", payload={"score": 2, "total": 3}),
        make_event("u-done", "unit-completed", item_scope=None, item_id=None, unit_id="u02-greetings-introductions", payload={"score": 3, "total": 3}),
    ]
    assert (await push(client, token, events))["rejected"] == []
    units = (await client.get("/v1/progress/units", headers=auth(token))).json()
    assert len(units) == 16
    u2 = next(u for u in units if u["id"] == "u02-greetings-introductions")
    assert u2["learner_status"] == "completed" and u2["checkpoint_score"] == 3
    summary = (await client.get("/v1/progress/summary", headers=auth(token))).json()
    assert summary["completed_units"] == 1


async def test_xp_cannot_be_forged_or_double_counted(client):
    token = await register(client)
    day = "2026-11-10"
    forged = [
        make_event("f1", "xp-awarded", item_scope=None, item_id=None, payload={"key": f"review:1:{day}", "amount": 100}),
        make_event("f2", "xp-awarded", item_scope=None, item_id=None, payload={"key": "cheat:1", "amount": 1}),
        make_event("f3", "xp-awarded", item_scope=None, item_id=None, payload={"key": f"review:1:{day}", "amount": -5}),
        make_event("f4", "xp-awarded", item_scope=None, item_id=None, payload={"key": f"review:1:{day}", "amount": True}),
        make_event("f5", "xp-awarded", item_scope=None, item_id=None, payload={"amount": 5}),
    ]
    result = await push(client, token, forged)
    assert result["accepted"] == [] and len(result["rejected"]) == 5
    assert await xp(client, token) == 0

    valid = make_event("v1", "xp-awarded", item_scope=None, item_id=None, payload={"key": f"review:1:{day}", "amount": 5})
    await push(client, token, [valid])
    assert await xp(client, token) == 5
    # Same reward key resent under a brand new event id must not pay again.
    again = make_event("v2", "xp-awarded", item_scope=None, item_id=None, payload={"key": f"review:1:{day}", "amount": 5})
    await push(client, token, [again])
    assert await xp(client, token) == 5
    # Replaying the first event is a duplicate.
    assert (await push(client, token, [valid]))["duplicates"] == ["v1"]
    assert await xp(client, token) == 5


async def test_daily_xp_cap(client, monkeypatch):
    monkeypatch.setattr(main, "DAILY_XP_CAP", 12)
    token = await register(client)
    events = [make_event(f"x{i}", "xp-awarded", item_scope=None, item_id=None, payload={"key": f"review:{i}:d", "amount": 5}) for i in range(5)]
    await push(client, token, events)
    assert await xp(client, token) == 12


async def test_bootstrap_changes_and_second_device(client):
    token = await register(client)
    await push(client, token, [make_event(f"e{i}", item_id=str(i)) for i in range(5)], device="phone")
    boot = (await client.get("/v1/sync/bootstrap", headers=auth(token))).json()
    assert len(boot["progress"]["itemProgress"]) == 5 and boot["serverCursor"]

    page1 = (await client.get("/v1/sync/changes?limit=2", headers=auth(token))).json()
    assert len(page1["events"]) == 2 and page1["hasMore"]
    page2 = (await client.get(f"/v1/sync/changes?limit=10&cursor={page1['nextCursor']}", headers=auth(token))).json()
    assert len(page2["events"]) == 3
    seen = [e["client_event_id"] for e in page1["events"] + page2["events"]]
    assert sorted(seen) == [f"e{i}" for i in range(5)]
    tail = (await client.get(f"/v1/sync/changes?cursor={page2['nextCursor']}", headers=auth(token))).json()
    assert tail["events"] == []

    assert (await client.get("/v1/sync/changes?cursor=garbage", headers=auth(token))).status_code == 400


async def test_progress_version_increments(client):
    token = await register(client)
    one = await push(client, token, [make_event("v1")])
    two = await push(client, token, [make_event("v2", item_id="2")])
    assert two["progress_version"] == one["progress_version"] + 1


async def test_users_are_isolated(client):
    alice = await register(client, "alice@example.test")
    bob = await register(client, "bob@example.test")
    await push(client, alice, [make_event("shared-id", item_id="1")])
    # Same client_event_id for another user is a new event, not a duplicate.
    assert (await push(client, bob, [make_event("shared-id", item_id="7")]))["accepted"] == ["shared-id"]

    for path in ("/v1/progress/items", "/v1/sync/changes", "/v1/progress/units"):
        data = (await client.get(path, headers=auth(bob))).json()
        text = str(data)
        assert "'item_id': '1'" not in text and "'item_id': '1'," not in text
    bob_items = (await client.get("/v1/progress/items", headers=auth(bob))).json()
    assert [i["item_id"] for i in bob_items] == ["7"]
    boot = (await client.get("/v1/sync/bootstrap", headers=auth(bob))).json()
    assert [i["item_id"] for i in boot["progress"]["itemProgress"]] == ["7"]
    alice_xp = await xp(client, alice)
    assert alice_xp == 0


async def test_too_many_events_in_one_request(client):
    token = await register(client)
    events = [make_event(f"e{i}") for i in range(main.MAX_SYNC_EVENTS + 1)]
    r = await client.post("/v1/sync/events", json={"device_id": "d", "events": events}, headers=auth(token))
    assert r.status_code == 422


async def test_sync_rate_limit(client, monkeypatch):
    monkeypatch.setattr(main, "RATE_SYNC_PER_MIN", 2)
    token = await register(client)
    codes = [(await client.post("/v1/sync/events", json={"device_id": "d", "events": []}, headers=auth(token))).status_code for _ in range(3)]
    assert codes == [200, 200, 429]


async def test_course_seed_has_sixteen_units(client):
    async with main.pool.acquire() as conn:
        n = await conn.fetchval("SELECT count(*) FROM course_units")
        h = await conn.fetchval("SELECT content_hash FROM course_versions cv JOIN course_units cu ON cu.course_version_id = cv.id LIMIT 1")
    assert n == 16 and len(h) == 64 and not h.startswith("replace")
