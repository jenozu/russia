from pathlib import Path
p = Path('scripts/build_standalone.py')
s = p.read_text()

old_markup = '''<div class="ratingRow hidden" id="ratings"><span id="whyThis">New item</span><button class="again" onclick="rateCurrent('again')">Again</button><button class="hard" onclick="rateCurrent('hard')">Hard</button><button class="good" onclick="rateCurrent('good')">Good</button><button class="easy" onclick="rateCurrent('easy')">Easy</button></div></div></div>'''
new_markup = '''<div class="ratingRow hidden" id="ratings"><span id="whyThis">New item</span><button class="again" onclick="rateCurrent('again')">Again</button><button class="hard" onclick="rateCurrent('hard')">Hard</button><button class="good" onclick="rateCurrent('good')">Good</button><button class="easy" onclick="rateCurrent('easy')">Easy</button></div><div class="quizPanel" id="quizPanel"><div class="recordHeader"><strong>Quick check · Russian → English</strong><span id="quizState">not started</span></div><p class="transcribeNote">One focused question. Pick the meaning of the Russian word, then retry without losing your place.</p><button class="primary" id="quizStart" onclick="startQuiz()">Start multiple choice</button><div id="quizBody" class="hidden"><div class="quizPrompt"><div class="eyebrow">WHAT DOES THIS MEAN?</div><strong id="quizRussian"></strong></div><div id="quizChoices" class="quizChoices"></div><div id="quizFeedback" class="quizFeedback"></div><button class="ghost hidden" id="quizRetry" onclick="retryQuiz()">↻ Retry this question</button></div></div></div></div>'''
if old_markup not in s:
    raise SystemExit('markup anchor not found')
s = s.replace(old_markup, new_markup, 1)

old_state = "let state=normalizeState(JSON.parse(localStorage.getItem('azbuka-standalone')||'null')),day=1,index=0,revealed=false;const $=id=>document.getElementById(id);"
new_state = "let state=normalizeState(JSON.parse(localStorage.getItem('azbuka-standalone')||'null')),day=1,index=0,revealed=false,quizStarted=false,quizAnswered=false,quizChoices=[];const $=id=>document.getElementById(id);"
if old_state not in s:
    raise SystemExit('state anchor not found')
s = s.replace(old_state, new_state, 1)

old_day = "b.onclick=()=>{recordingController.discard();transcriptionController.reset();day=i+1;index=0;revealed=false;renderStage()}"
new_day = "b.onclick=()=>{recordingController.discard();transcriptionController.reset();day=i+1;index=0;revealed=false;quizStarted=false;quizAnswered=false;renderStage()}"
if old_day not in s:
    raise SystemExit('day anchor not found')
s = s.replace(old_day, new_day, 1)

old_render_end = "$('checklist').innerHTML=['Recognize at least 80 of 100 from Russian → English.','Produce at least 70 of 100 from English → Russian.','Say the sentence patterns without looking.','Introduce yourself; ask where something is; ask for repetition and help.'].map(x=>'<div class=\"line\"><b>□ '+x+'</b></div>').join('')}function reveal(){revealed=true;renderStage()}"
new_render_end = "$('checklist').innerHTML=['Recognize at least 80 of 100 from Russian → English.','Produce at least 70 of 100 from English → Russian.','Say the sentence patterns without looking.','Introduce yourself; ask where something is; ask for repetition and help.'].map(x=>'<div class=\"line\"><b>□ '+x+'</b></div>').join('');renderQuiz()}function reveal(){revealed=true;renderStage()}"
if old_render_end not in s:
    raise SystemExit('render end anchor not found')
s = s.replace(old_render_end, new_render_end, 1)

old_rate = "function rateCurrent(rating){recordingController.discard();transcriptionController.reset();let x=list()[index%list().length];scheduleRecord(state.stageItems,x.n,rating);"
new_rate = "function rateCurrent(rating){recordingController.discard();transcriptionController.reset();quizStarted=false;quizAnswered=false;let x=list()[index%list().length];scheduleRecord(state.stageItems,x.n,rating);"
if old_rate not in s:
    raise SystemExit('rate anchor not found')
s = s.replace(old_rate, new_rate, 1)

anchor = "function renderAlphabet(){"
insert = r'''function quizChoicesFor(item){let pool=ITEMS.filter(x=>x.n!==item.n).map(x=>x.en).filter((x,i,a)=>a.indexOf(x)===i),choices=[item.en];for(let i=0;choices.length<4&&i<pool.length*2;i++){let candidate=pool[(item.n*7+i*11)%pool.length];if(!choices.includes(candidate))choices.push(candidate)}return choices.sort((a,b)=>a===item.en?-1:b===item.en?1:a.localeCompare(b))}function startQuiz(){quizStarted=true;quizAnswered=false;renderQuiz()}function renderQuiz(){let panel=$('quizPanel');if(!panel)return;panel.classList.toggle('hidden',!revealed);$('quizStart').classList.toggle('hidden',quizStarted);$('quizBody').classList.toggle('hidden',!quizStarted);$('quizState').textContent=quizStarted?(quizAnswered?'answered':'ready'):'not started';if(!quizStarted)return;let item=list()[index%list().length];quizChoices=quizChoicesFor(item);$('quizRussian').textContent=item.ru;$('quizChoices').innerHTML=quizChoices.map((choice,i)=>'<button class="quizChoice" onclick="answerQuiz('+i+')">'+choice+'</button>').join('');let feedback=$('quizFeedback'),retry=$('quizRetry');if(quizAnswered){let record=state.stageItems[item.n]||{};let correct=record.lastQuizCorrect===true;feedback.textContent=correct?'Correct — nice recognition. This review is scheduled for later.':'Not quite. The right meaning is “'+item.en+'”. Try it once more, then rate the card when ready.';feedback.className='quizFeedback '+(correct?'good':'bad');document.querySelectorAll('.quizChoice').forEach((b,i)=>{b.disabled=true;b.classList.toggle('correct',quizChoices[i]===item.en);b.classList.toggle('wrong',quizChoices[i]!==item.en&&i===record.lastQuizChoice)});retry.classList.remove('hidden')}else{feedback.textContent='';feedback.className='quizFeedback';retry.classList.add('hidden')}}function answerQuiz(choiceIndex){if(!quizStarted||quizAnswered)return;let item=list()[index%list().length],correct=quizChoices[choiceIndex]===item.en,record=scheduleRecord(state.stageItems,item.n,correct?'good':'again');record.quizAttempts=(record.quizAttempts||0)+1;record.lastQuizCorrect=correct;record.lastQuizChoice=choiceIndex;record.lastQuizMode='ru-en';record.lastQuizAt=new Date().toISOString();state.stageItems[item.n]=record;state.events.push({type:'quiz-review',mode:'ru-en',id:item.n,correct,choice:quizChoices[choiceIndex],at:record.lastQuizAt,nextReview:record.nextReview});if(!state.daily.reviewed.includes(item.n))state.daily.reviewed.push(item.n);save();quizAnswered=true;renderQuiz()}function retryQuiz(){quizAnswered=false;renderQuiz()}'''
if anchor not in s:
    raise SystemExit('alphabet anchor not found')
s = s.replace(anchor, insert + anchor, 1)

p.write_text(s)
print('patched milestone 7 generator')
