from pathlib import Path
p=Path('scripts/build_standalone.py')
s=p.read_text()

s=s.replace("let state=normalizeState(JSON.parse(localStorage.getItem('azbuka-standalone')||'null')),day=1,index=0,revealed=false,quizStarted=false,quizAnswered=false,quizChoices=[],quizItemId=null;", "let state=normalizeState(JSON.parse(localStorage.getItem('azbuka-standalone')||'null')),day=1,index=0,revealed=false,quizStarted=false,quizAnswered=false,quizChoices=[],quizItemId=null,quizReason='',quizSession={seen:{},asked:0};")

s=s.replace("day=i+1;index=0;revealed=false;quizStarted=false;quizAnswered=false;quizItemId=null;renderStage()", "day=i+1;index=0;revealed=false;quizStarted=false;quizAnswered=false;quizItemId=null;quizReason='';quizSession={seen:{},asked:0};renderStage()")

old_markup = '<p class="transcribeNote">One focused question. Pick the meaning of the Russian word, then retry without losing your place.</p><button class="primary" id="quizStart" onclick="startQuiz()">Start multiple choice</button><div id="quizBody" class="hidden"><div class="quizPrompt">'
new_markup = '<p class="transcribeNote">One focused question. Pick the meaning of the Russian word, then retry without losing your place.</p><button class="primary" id="quizStart" onclick="startQuiz()">Start multiple choice</button><div id="quizBody" class="hidden"><div class="quizReason" id="quizReason"></div><div class="quizPrompt">'
if old_markup not in s: raise SystemExit('quiz markup anchor missing')
s=s.replace(old_markup,new_markup,1)

old_markup2 = '<button class="ghost hidden" id="quizRetry" onclick="retryQuiz()">↻ Retry this question</button></div></div></div></div>'
new_markup2 = '<button class="ghost hidden" id="quizRetry" onclick="retryQuiz()">↻ Retry this question</button><button class="primary hidden" id="quizNext" onclick="nextQuiz()">Next adaptive question →</button></div></div></div></div>'
if old_markup2 not in s: raise SystemExit('quiz end anchor missing')
s=s.replace(old_markup2,new_markup2,1)

old_start = "function startQuiz(){quizStarted=true;quizAnswered=false;let current=list()[index%list().length];quizItemId=current.n;renderQuiz()}"
new_start = "function startQuiz(){quizStarted=true;quizAnswered=false;let picked=chooseAdaptiveQuizItem();quizItemId=picked.item.n;index=Math.max(0,list().findIndex(x=>x.n===quizItemId));quizReason=picked.reason;renderStage()}"
if old_start not in s: raise SystemExit('startQuiz anchor missing')
s=s.replace(old_start,new_start,1)

old_render = "function renderQuiz(){let panel=$('quizPanel');if(!panel)return;panel.classList.toggle('hidden',!revealed);$('quizStart').classList.toggle('hidden',quizStarted);$('quizBody').classList.toggle('hidden',!quizStarted);$('quizState').textContent=quizStarted?(quizAnswered?'answered':'ready'):'not started';if(!quizStarted)return;let item=ITEMS.find(x=>x.n===quizItemId)||list()[index%list().length];quizItemId=item.n;quizChoices=quizChoicesFor(item);$('quizRussian').textContent=item.ru;$('quizChoices').innerHTML=quizChoices.map((choice,i)=>'<button class=\"quizChoice\" onclick=\"answerQuiz('+i+')\">'+choice+'</button>').join('');let feedback=$('quizFeedback'),retry=$('quizRetry');if(quizAnswered){let record=state.stageItems[item.n]||{};let correct=record.lastQuizCorrect===true;feedback.textContent=correct?'Correct — nice recognition. This review is scheduled for later.':'Not quite. The right meaning is “'+item.en+'”. Try it once more, then rate the card when ready.';feedback.className='quizFeedback '+(correct?'good':'bad');document.querySelectorAll('.quizChoice').forEach((b,i)=>{b.disabled=true;b.classList.toggle('correct',quizChoices[i]===item.en);b.classList.toggle('wrong',quizChoices[i]!==item.en&&i===record.lastQuizChoice)});retry.classList.remove('hidden')}else{feedback.textContent='';feedback.className='quizFeedback';retry.classList.add('hidden')}}"
new_render = "function renderQuiz(){let panel=$('quizPanel');if(!panel)return;panel.classList.toggle('hidden',!revealed);$('quizStart').classList.toggle('hidden',quizStarted);$('quizBody').classList.toggle('hidden',!quizStarted);$('quizState').textContent=quizStarted?(quizAnswered?'answered':'ready'):'not started';if(!quizStarted)return;let item=ITEMS.find(x=>x.n===quizItemId)||list()[index%list().length];quizItemId=item.n;quizChoices=quizChoicesFor(item);$('quizReason').textContent=quizReason||'Adaptive review selected from this day’s Stage 1 queue.';$('quizRussian').textContent=item.ru;$('quizChoices').innerHTML=quizChoices.map((choice,i)=>'<button class=\"quizChoice\" onclick=\"answerQuiz('+i+')\">'+choice+'</button>').join('');let feedback=$('quizFeedback'),retry=$('quizRetry'),next=$('quizNext');if(quizAnswered){let record=state.stageItems[item.n]||{};let correct=record.lastQuizCorrect===true;feedback.textContent=correct?'Correct — nice recognition. This review is scheduled for later.':'Not quite. The right meaning is “'+item.en+'”. Try it once more, then rate the card when ready.';feedback.className='quizFeedback '+(correct?'good':'bad');document.querySelectorAll('.quizChoice').forEach((b,i)=>{b.disabled=true;b.classList.toggle('correct',quizChoices[i]===item.en);b.classList.toggle('wrong',quizChoices[i]!==item.en&&i===record.lastQuizChoice)});retry.classList.remove('hidden');next.classList.remove('hidden')}else{feedback.textContent='';feedback.className='quizFeedback';retry.classList.add('hidden');next.classList.add('hidden')}}"
if old_render not in s: raise SystemExit('renderQuiz anchor missing')
s=s.replace(old_render,new_render,1)

old_answer = "function answerQuiz(choiceIndex){if(!quizStarted||quizAnswered)return;let item=ITEMS.find(x=>x.n===quizItemId)||list()[index%list().length],correct=quizChoices[choiceIndex]===item.en"
new_answer = "function answerQuiz(choiceIndex){if(!quizStarted||quizAnswered)return;let item=ITEMS.find(x=>x.n===quizItemId)||list()[index%list().length],correct=quizChoices[choiceIndex]===item.en"
if old_answer not in s: raise SystemExit('answer anchor missing')
# no-op anchor validation

old_retry = "function retryQuiz(){quizAnswered=false;renderQuiz()}"
new_retry = "function retryQuiz(){quizAnswered=false;renderQuiz()}function nextQuiz(){let picked=chooseAdaptiveQuizItem();quizStarted=true;quizAnswered=false;quizItemId=picked.item.n;quizReason=picked.reason;index=Math.max(0,list().findIndex(x=>x.n===quizItemId));revealed=true;renderStage()}"
if old_retry not in s: raise SystemExit('retry anchor missing')
s=s.replace(old_retry,new_retry,1)

anchor='function quizChoicesFor(item){'
insert=r'''function adaptiveProfile(item){let r=state.stageItems[item.n];let seen=quizSession.seen[item.n]||0;let isNew=!r||!r.lastReviewed;let due=isDue(r);let weak=!!r&&(r.lastQuizCorrect===false||r.lastRating==='again'||r.lastRating==='hard'||(r.attempts>1&&r.correct/r.attempts<.6));let strong=!!r&&(r.lastQuizCorrect===true||r.lastRating==='good'||r.lastRating==='easy');let score=due?1000:weak?820:isNew?620:strong?360:500;if(r?.lastQuizCorrect===false)score+=180;if(seen>=1)score-=650*seen;return{r,seen,isNew,due,weak,strong,score}}function chooseAdaptiveQuizItem(){let pool=ITEMS.filter(x=>x.day===day);let ranked=pool.map(item=>({item,profile:adaptiveProfile(item)})).sort((a,b)=>b.profile.score-a.profile.score||a.item.n-b.item.n);let eligible=ranked.filter(x=>x.profile.seen<2);let pick=(eligible[0]||ranked[0]).item;let profile=adaptiveProfile(pick);quizSession.seen[pick.n]=(quizSession.seen[pick.n]||0)+1;quizSession.asked++;let reason=profile.due?'Back because this item is due for review.':profile.weak?'Back because it was tricky last time.':profile.isNew?'New material — a gentle first check.':profile.strong?'Maintenance review — keeping a strong item active.':'Balanced review — mixing recall and maintenance.';return{item:pick,reason}}'''
if anchor not in s: raise SystemExit('quiz helper anchor missing')
s=s.replace(anchor,insert+anchor,1)

p.write_text(s)
print('patched milestone 8')
