(() => {
  const $=s=>document.querySelector(s), B=window.JournalBackend, M=window.JournalEditorModel, esc=B.escape, O=window.JournalOrganizer;
  let db,rows=[],chapters=[],published=[],current=null,draftId=crypto.randomUUID(),photos=[],blocks=[],signed={},dirty=false,busy=false,filter='draft',listPage=1,view='entries',autoTimer=null,editVersion=0,storyTools=false,organizerReady=false,editorStep=0,undoTrash=null,writeScroll=0,previewMode='desktop';
  function message(text,error=false){$('#status').textContent=text;$('#status').classList.toggle('error',error);if(view==='editor'&&/Uploading|Adding your photo/.test(text))$('#save-state').textContent=text;}
  function working(on){busy=on;$('#workspace').setAttribute('aria-busy',String(on));document.querySelectorAll('#workspace button,#workspace input,#workspace textarea,#workspace select,dialog button,dialog input,dialog textarea,dialog select').forEach(e=>e.disabled=on);$('#logout').disabled=on;if(!on)document.querySelectorAll('[data-org-kind]').forEach(b=>{const count=b.dataset.orgKind==='journey'?window.JournalJourney.periods.length:window.JournalJourney.themes.length,target=Number(b.dataset.orgIndex)+Number(b.dataset.orgDelta);b.disabled=target<0||target>=count;});if(!on)document.querySelectorAll('[data-move]').forEach(b=>{const index=Number(b.dataset.move??b.dataset.order),length=b.dataset.move!==undefined?blocks.length:chapters.length;b.disabled=index+Number(b.dataset.delta)<0||index+Number(b.dataset.delta)>=length;});}
  async function guard(fn){if(busy)return;working(true);try{await fn();}catch(e){message(e.message||'Something went wrong. Please try again.',true);}finally{working(false);}}
  function date(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function leave(){return !dirty||confirm('Leave this entry without saving your latest changes?');}
  function scheduleAutosave(){
    clearTimeout(autoTimer);
    if(!dirty||view!=='editor'||$('#workspace').hidden)return;
    autoTimer=setTimeout(async()=>{
      if(busy){scheduleAutosave();return;}
      try{M.validate(collect(),{draft:true});}catch(_){$('#save-state').textContent='Finish the title and story to save';return;}
      busy=true;
      try{await save(false,true);}catch(e){$('#save-state').textContent='Could not save — use Save draft';message('Your latest changes are still on this page. '+e.message,true);}
      finally{busy=false;}
    },3500);
  }
  function changed(){$('#entry-error').hidden=true;dirty=true;editVersion++;$('#save-state').textContent='Unsaved changes';$('#save-state').classList.add('unsaved');scheduleAutosave();}
  function lock(){$('#auth-loading').hidden=true;clearTimeout(autoTimer);$('#workspace').hidden=true;$('#logout').hidden=true;$('#room-menu-toggle').hidden=true;$('#login-panel').hidden=false;document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
  function publicVersion(id){return published.find(e=>e.id===id);}
  function hasRevision(row){const live=publicVersion(row.id);return live&&live.updated_at!==row.updated_at;}
  function chapterOptions(selected='',all=false){return (all?'<option value="">All collections</option>':'')+chapters.map(c=>`<option value="${esc(c.id)}"${selected===c.id?' selected':''}>${esc(c.title)}</option>`).join('');}
  async function load(){
    const results=await Promise.all([db.from('journal_entries').select('*').order('entry_date',{ascending:false}),db.from('journal_chapters').select('*').order('sort_order').order('id'),db.from('journal_public_entries').select('*')]);
    results.forEach(r=>{if(r.error)throw new Error(r.error.message+' If you just upgraded, run backend/upgrade-writing-room.sql first.');});
    rows=results[0].data;chapters=results[1].data;published=results[2].data;
    signed={...signed,...await B.signedPhotos([...chapters.map(c=>c.image_path),...rows.filter(r=>r.status!=='trashed').map(r=>r.cover_path)])};
    const chosen=$('#chapter').value;
    $('#chapter').innerHTML=chapterOptions(chosen);refreshJourneyChoices();
    drawList();drawTrash();
  }
  function drawList(){
    const search=$('#entry-search').value.trim().toLowerCase(),journey=$('#list-journey').value,theme=$('#list-theme').value,from=$('#list-from').value,to=$('#list-to').value;
    const active=[journey,theme,from,to].filter(Boolean).length;$('#filter-count').hidden=!active;$('#filter-count').textContent=active;
    $('#draft-count').textContent=rows.filter(r=>r.status==='draft').length;$('#published-count').textContent=rows.filter(r=>r.status==='published').length;
    document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));
    const visible=rows.filter(r=>r.status===filter&&r.title.toLowerCase().includes(search)&&(!theme||(r.themes||[]).includes(theme))&&(!from||r.entry_date>=from)&&(!to||r.entry_date<=to)&&(!journey||window.JournalJourney.inPeriod({date:r.entry_date,journeyId:r.journey_id},journey)));
    const pageCount=Math.max(1,Math.ceil(visible.length/5));listPage=Math.min(listPage,pageCount);const pager=$('#entry-pagination');pager.hidden=pageCount<2;pager.innerHTML=`<button type="button" data-list-page="${listPage-1}" ${listPage===1?'disabled':''}>← Previous</button><span>Page ${listPage} of ${pageCount}</span><button type="button" data-list-page="${listPage+1}" ${listPage===pageCount?'disabled':''}>Next →</button>`;
    $('#entry-list').innerHTML=visible.slice((listPage-1)*5,listPage*5).map(r=>{
      const thumb=signed[r.cover_path];
      const title=esc(r.title),isDraft=r.status==='draft';
      return `<article class="letter-card"><div class="letter-card-main">${thumb?`<img src="${esc(thumb)}" alt="" width="160" height="110" loading="lazy">`:'<span class="entry-text-mark" aria-hidden="true">✎</span>'}<div class="letter-card-content"><h2>${title}</h2><p class="letter-status"><span class="status-badge ${r.status}">${isDraft?'Draft':'On the journal'}</span><span class="letter-edited">Last edited ${new Date(r.updated_at).toLocaleDateString(undefined,{month:'long',day:'numeric'})}</span></p>${hasRevision(r)?'<p class="revision-note">You have changes that are not on the journal yet.</p>':''}</div></div><div class="letter-card-actions"><button type="button" class="letter-open btn" data-id="${esc(r.id)}" aria-label="${isDraft?'Keep writing':'Edit'} ${title}">${isDraft?'Keep writing':'Edit story'}</button><details class="more-menu"><summary aria-label="More choices for ${title}">More</summary><div class="more-menu-list">${r.status==='published'?`<a class="letter-live" target="_blank" rel="noopener" href="entry.html?id=${encodeURIComponent(r.id)}">See it on the journal ↗</a>`:''}<button type="button" class="entry-trash-button danger" data-trash-id="${esc(r.id)}" aria-label="Move ${title} to Trash">Move to Trash</button></div></details></div></article>`;
    }).join('')||`<div class="letters-empty"><p class="hand">${filter==='draft'?'a fresh page is waiting':'one story at a time'}</p><h2>${search||journey||theme||from||to?'No matching stories':filter==='draft'?'Your next story starts here.':'Nothing on the journal just yet.'}</h2><p>${search||journey||theme||from||to?'Try a different word, or clear the filter.':filter==='draft'?'Choose “Write a new story” to begin.':'When you publish a story, it will appear here.'}</p></div>`;
  }
  async function open(row=null){
    clearTimeout(autoTimer);$('#entry-error').hidden=true;editVersion++;$('#publication-success').hidden=true;$('#editor-panel').classList.remove('just-published');
    current=row?structuredClone(row):null;draftId=row?.id||crypto.randomUUID();photos=structuredClone(row?.photos||[]);blocks=row?M.legacyBlocks(row):[M.block('text')];
    $('#entry-form').reset();$('#entry-byline').value=row?.byline||'';$('#theme-options').innerHTML=O.themeOptions(row?.themes||[]);$('#entry-new-theme').hidden=!organizerReady;$('#entry-journey').innerHTML=O.journeyOptions(row?.journey_id||'');$('#entry-title').value=row?.title||'';$('#excerpt').value=row?.excerpt||'';$('#entry-date').value=row?.entry_date||date();$('#chapter').innerHTML=chapterOptions(row?.chapter_id||chapters[0]?.id);
    updateYearHint();$('#editor-heading').textContent=row?(row.status==='published'?'Editing a story on the journal':'Your draft'):'A new story';
    $('#status-badge').textContent=row?.status==='published'?'On the journal':'Draft';$('#status-badge').className='status-badge '+(row?.status||'draft');
    $('#save-state').textContent=row?`All changes saved${hasRevision(row)?' · not shared yet':''}`:'Not saved yet';$('#save-state').classList.remove('unsaved');
    $('#published-note').hidden=row?.status!=='published';$('#save-draft').textContent=row?.status==='published'?'Save for later':'Save draft';$('#publish').textContent=row?.status==='published'?'Update the journal':'Share on the journal';$('#unpublish').hidden=row?.status!=='published';$('#trash-entry').hidden=!row;
    $('#view-entry').hidden=row?.status!=='published';$('#view-entry').href=row?`entry.html?id=${encodeURIComponent(row.id)}`:'#';
    signed={...signed,...await B.signedPhotos(photos.map(p=>p.path))};dirty=false;drawPhotoLibrary(row?.cover_path||'');drawBlocks();drawList();goStep(0,{focus:false,validate:false});
  }
  function photoOptions(selected='',blank='Choose a photo'){return `<option value="">${blank}</option>`+photos.map((p,i)=>`<option value="${esc(p.path)}"${p.path===selected?' selected':''}>${i+1}. ${esc(p.alt||p.caption||'Photo '+(i+1))}</option>`).join('');}
  function photoPreview(path){return path&&signed[path]?`<img class="block-photo-preview" src="${esc(signed[path])}" alt="Selected story photo" width="500" height="350">`:'';}
  function insertion(after){return `<details class="between-story"><summary>+ Add something here</summary><div class="insert-options" role="group" aria-label="Insert after this section">${[['text','More writing'],['photo','A photo'],['pair','Two photos'],['quote','A quote']].map(([type,label])=>`<button type="button" data-insert="${after}" data-type="${type}">${label}</button>`).join('')}</div></details>`;}
  function photoFields(i,path,slot=null){
    const photo=photos.find(p=>p.path===path),field=slot===null?'photo':`pair-${slot}`;
    const uploadIndex=slot===null?'':` data-upload-slot="${slot}"`;
    const layout=slot===null?`<div class="photo-layout-picker" role="group" aria-label="Photo layout">${[['center','Centered'],['full','Full width'],['pair','Two together']].map(([value,label])=>`<button type="button" data-photo-layout="${value}" data-layout-index="${i}" aria-pressed="${blocks[i].layout===value}"><span class="layout-thumb layout-${value}" aria-hidden="true"><i></i>${value==='pair'?'<i></i>':''}</span>${label}</button>`).join('')}</div>`:'';
    return `<div class="inline-photo">${photoPreview(path)}<div class="photo-main-actions"><label class="photo-upload-card ${path?'has-photo':''}">${!path?'<span class="photo-upload-icon" aria-hidden="true">▧</span>':''}<strong>${path?'Replace photo':slot===null?'Add a photo to your story':slot===0?'Add the first photo':'Add the second photo'}</strong>${!path?'<span class="field-help">A moment worth remembering</span><span class="upload-choice">Choose photo</span>':''}<input type="file" data-inline-upload="${i}"${uploadIndex} accept="image/jpeg,image/png,image/webp"></label>${path?`<button type="button" class="text-button danger" data-clear-photo="${i}"${uploadIndex}>Remove photo</button>`:''}</div>${photo?`<label class="inline-caption"><span class="sr-only">Photo caption</span><input data-asset="${esc(path)}" data-asset-field="caption" maxlength="500" placeholder="Add a caption…" value="${esc(photo.caption||'')}"></label>`:''}<details class="photo-settings"><summary>Photo size &amp; options</summary>${layout}${photo?`<label>Image description<input data-asset="${esc(path)}" data-asset-field="alt" maxlength="300" placeholder="Describe the image for readers who can’t see it" value="${esc(photo.alt||'')}"><span class="field-help">Helps readers using a screen reader.</span></label>`:''}</details></div>`;
  }
  function drawBlocks(){
    $('#blocks').innerHTML=blocks.map((b,i)=>{
      let fields='';
      if(b.type==='text')fields=`<label class="story-text"><span class="sr-only">Story text</span><textarea rows="5" maxlength="100000" placeholder="${i===0?'Dear family and friends…':'Keep the story going…'}" data-block="${i}" data-field="text">${esc(b.text)}</textarea></label>`;
      if(b.type==='quote')fields=`<label class="story-quote"><span class="sr-only">Quote</span><textarea rows="3" maxlength="5000" placeholder="A thought worth remembering…" data-block="${i}" data-field="text">${esc(b.text)}</textarea></label><label class="quote-author"><span class="sr-only">Who said it</span><input maxlength="200" placeholder="Who said it? (optional)" data-block="${i}" data-field="attribution" value="${esc(b.attribution)}"></label>`;
      if(b.type==='photo')fields=photoFields(i,b.photo);
      if(b.type==='pair')fields=`<div class="inline-photo-pair">${[0,1].map(n=>photoFields(i,b.photos[n],n)).join('')}</div><details class="photo-settings"><summary>Photo layout</summary><div class="photo-layout-picker" role="group" aria-label="Photo layout">${[['center','Centered'],['full','Full width'],['pair','Two together']].map(([value,label])=>`<button type="button" data-photo-layout="${value}" data-layout-index="${i}" aria-pressed="${value==='pair'}"><span class="layout-thumb layout-${value}" aria-hidden="true"><i></i>${value==='pair'?'<i></i>':''}</span>${label}</button>`).join('')}</div></details>`;
      return `<section class="story-block story-${b.type}" data-block-card="${i}" aria-label="${b.type==='pair'?'Two photos':b.type} section ${i+1}"><div class="block-heading"><span class="block-kind">${({text:"Writing",photo:"Photo",pair:"Two photos",quote:"Quote"})[b.type]}</span><details class="block-menu"><summary aria-label="Options for section ${i+1}">Options</summary><div class="block-menu-list" role="group" aria-label="Section ${i+1} controls"><button type="button" data-move="${i}" data-delta="-1"${i===0?' disabled':''}>Move up ↑</button><button type="button" data-move="${i}" data-delta="1"${i===blocks.length-1?' disabled':''}>Move down ↓</button><button type="button" class="danger" data-remove-block="${i}">Remove this part</button></div></details></div>${fields}</section>${i<blocks.length-1?insertion(i):''}`;
    }).join('');
    document.querySelectorAll('#blocks textarea').forEach(grow);
  }
  function grow(textarea){textarea.style.height='auto';textarea.style.height=Math.max(140,textarea.scrollHeight||140)+'px';}
  function drawPhotoLibrary(cover=$('#cover-photo').value){
    $('#cover-photo').innerHTML=photoOptions(cover,'No cover photo yet');$('#cover-preview').innerHTML=photoPreview(cover);$('#remove-cover').hidden=true;
    const choices=[...new Set([...usedPhotoPaths(),...photos.map(p=>p.path)])],effective=cover||firstStoryPhoto();
    $('#cover-choices').innerHTML=choices.length?choices.map((p,i)=>`<button type="button" class="cover-choice" data-cover="${esc(p)}" aria-pressed="${p===effective}" aria-label="Use photo ${i+1} as the cover photo"><img src="${esc(signed[p]||'')}" alt="" width="200" height="150"><span class="cover-tag">${p===effective?'✓ Cover photo':'Use this'}</span></button>`).join(''):'<p class="field-help">No photos yet. A story without photos looks clean and simple on the journal.</p>';
    $('#cover-help').hidden=choices.length<2;$('#crop-cover').hidden=!effective;
    $('#photo-list').innerHTML=photos.map((p,i)=>`<div class="writer-photo"><p class="meta">PHOTO ${i+1}</p><img src="${esc(signed[p.path]||'')}" alt="${esc(p.alt||'Uploaded photo')}" width="400" height="300"><label>Description<input data-photo="${i}" data-field="alt" maxlength="300" value="${esc(p.alt||'')}"></label><label>Caption<input data-photo="${i}" data-field="caption" maxlength="500" value="${esc(p.caption||'')}"></label><button class="v-btn danger" type="button" data-remove-photo="${i}">Remove photo</button></div>`).join('')||'<p class="field-help">No photos yet. Upload one above.</p>';
  }
  function usedPhotoPaths(){const out=[];blocks.forEach(b=>{if(b.type==='photo'&&b.photo)out.push(b.photo);if(b.type==='pair')(b.photos||[]).forEach(p=>p&&out.push(p));});return out.filter(p=>photos.some(x=>x.path===p));}
  function firstStoryPhoto(){return usedPhotoPaths()[0]||photos[0]?.path||'';}
  function collect(){
    const content=blocks.filter(b=>b.type==='text'||b.type==='quote').map(b=>b.text).filter(Boolean).join('\n\n')||'Photo journal';
    return {id:draftId,title:$('#entry-title').value.trim(),chapter_id:$('#chapter').value,entry_date:$('#entry-date').value,excerpt:$('#excerpt').value.trim()||content.slice(0,180),content,photos:structuredClone(photos),blocks:structuredClone(blocks),cover_path:$('#cover-photo').value||firstStoryPhoto()||null,status:current?.status==='published'?'published':'draft',deleted_at:null,...(organizerReady?{journey_id:$('#entry-journey').value||null}:{}),...(storyTools?{byline:$('#entry-byline').value.trim(),themes:[...document.querySelectorAll('[name="entry-theme"]:checked')].map(e=>e.value)}:{})};
  }
  async function save(publish=false,quiet=false){
    clearTimeout(autoTimer);const activeStep=editorStep,revision=editVersion;const row=collect();validateEntry(row,{draft:!publish});$('#save-state').textContent='Saving…';
    const query=current?db.from('journal_entries').update(row).eq('id',row.id).eq('updated_at',current.updated_at).select().maybeSingle():db.from('journal_entries').insert(row).select().single();
    let {data,error}=await query;if(error)throw error;if(!data)throw new Error('This entry changed in another tab. Your text is still here; reload before saving again.');
    current=data;dirty=editVersion!==revision;
    if(publish){const result=await db.rpc('publish_journal_entry',{entry_id:data.id,expected_updated_at:data.updated_at});if(result.error){$('#save-state').textContent='Changes saved privately; publishing failed';throw new Error('Your changes were saved privately, but publishing failed: '+result.error.message);}data=Array.isArray(result.data)?result.data[0]:result.data;if(!data)throw new Error("Publishing returned no entry. Refresh to check its status.");current=data;}
    if(quiet){
      const index=rows.findIndex(r=>r.id===data.id);if(index<0)rows.unshift(data);else rows[index]=data;
      $('#save-state').textContent=dirty?'Unsaved changes':`All changes saved${data.status==='published'?' · not shared yet':''}`;$('#save-state').classList.toggle('unsaved',dirty);
      $('#trash-entry').hidden=false;drawList();if(dirty)scheduleAutosave();return;
    }
    filter=data.status;await load();await open(data);goStep(activeStep,{focus:false,validate:false});if(publish){$('#editor-panel').classList.add('just-published');$('#publication-success').hidden=false;$('#success-title').textContent=data.title;const cv=signed[data.cover_path];$('#success-cover').hidden=!cv;if(cv)$('#success-cover').src=cv;$('#publication-link').href=`entry.html?id=${encodeURIComponent(data.id)}`;window.scrollTo?.({top:0,behavior:'instant'});}message(publish?'':data.status==='published'?'Saved. The journal still shows the earlier version until you publish.':'Draft saved. Only you can read it.');
  }
  async function mutate(row,patch){const {data,error}=await db.from('journal_entries').update(patch).eq('id',row.id).eq('updated_at',row.updated_at).select().maybeSingle();if(error)throw error;if(!data)throw new Error('This entry changed in another tab. Refresh before continuing.');return data;}
  function drawTrash(){
    $('#trash-list').innerHTML=rows.filter(r=>r.status==='trashed').map(r=>`<article class="trash-row"><div><span class="status-badge trashed">TRASH</span><h2>${esc(r.title)}</h2><p class="field-help">Moved here ${new Date(r.deleted_at||r.updated_at).toLocaleDateString()}</p></div><div><button type="button" class="v-btn" data-restore="${r.id}">Restore as draft</button><button type="button" class="v-btn danger" data-delete="${r.id}">Delete permanently</button></div></article>`).join('')||'<p class="empty-panel">Nothing in Trash.</p>';
  }
  async function compress(file){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose JPEG, PNG or WebP photos.');if(file.size>10485760)throw new Error('Choose photos smaller than 10 MB each.');
    const bitmap=await createImageBitmap(file),scale=Math.min(1,1800/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('This photo could not be prepared.')),'image/jpeg',.86));
  }
  async function upload(file,prefix){const blob=await compress(file),path=`${prefix}/${crypto.randomUUID()}.jpg`;const {error}=await db.storage.from('journal-photos').upload(path,blob,{contentType:'image/jpeg',upsert:false});if(error)throw error;return path;}
  function switchSection(section){
    view=section;if(section==='organization')O.refreshCounts();
    document.querySelectorAll('[data-section]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.section===section||(section==='editor'&&b.dataset.section==='entries'))));
    ['entries','editor','organization','trash','ideas'].forEach(s=>$('#'+s+'-panel').hidden=s!==section);
    $('#workspace').classList.toggle('writing-mode',section==='editor');
    if(section==='editor'){scheduleAutosave();if(editorStep===0)document.querySelectorAll('#blocks textarea').forEach(grow);}else clearTimeout(autoTimer);
    window.scrollTo?.({top:0,behavior:'instant'});
  }
  function goStep(step,{focus=true,validate=true}={}){
    if(validate&&step>editorStep){validateEntry(collect(),{draft:step<2});}
    if(step===2&&editorStep!==2)writeScroll=window.scrollY||0;editorStep=step;$('#editor-panel').classList.toggle('review-mode',step===2);
    ['write-step','details-step','review-step'].forEach((id,index)=>$('#'+id).hidden=index!==step);
    ['step-write','step-details','step-review'].forEach((id,index)=>$('#'+id).setAttribute('aria-current',index===step?'step':'false'));
    $('#guided-back').hidden=step===0;$('#guided-next').hidden=step!==0;$('#publish').hidden=step===0;$('#save-draft').hidden=step!==0;
    if(step===1){drawPhotoLibrary($('#cover-photo').value);$('#details-heading').textContent=current?.status==='published'?'Ready to update the journal?':'Ready to share?';}
    if(step===0)document.querySelectorAll('#blocks textarea').forEach(grow);
    if(step===2)renderReview();
    if(focus){const heading=$(['#write-heading','#details-heading','#review-heading'][step]);heading.setAttribute('tabindex','-1');heading.focus();heading.scrollIntoView?.({block:'nearest',behavior:'auto'});}
  }
  function renderReview(){
    $('#preview-photo-status').hidden=true;
    const row=collect(),journey=window.JournalJourney.forEntry({date:row.entry_date,journeyId:row.journey_id});
    $('#publish-review').innerHTML=`<div><span>Story</span><p>${esc(row.title)}</p></div><div><span>Journey section</span><p>${esc(journey?.title||'All entries')}</p></div><div><span>Experience date</span><p>${esc(row.entry_date)}</p></div><div><span>Written by</span><p>${esc(row.byline||'No name shown')}</p></div><div><span>Themes</span><p>${row.themes?.length?row.themes.map(t=>esc(window.JournalJourney.themeName(t))).join(', '):'None selected'}</p></div><div><span>Cover photo</span><p>${row.cover_path?'Your uploaded photo':'No cover photo — a clean text layout'}</p></div>`;
    $('#review-frame').srcdoc=previewMarkup(row);
  }
  async function leaveEditor(){
    if(!dirty)return true;
    let valid=true;try{M.validate(collect(),{draft:true});}catch(_){valid=false;}
    if(valid)await save(false,true);else{if(!confirm('This story needs a title before it can save. Leave without saving these changes?'))return false;dirty=false;clearTimeout(autoTimer);}
    return true;
  }
  function previewMarkup(row){
    const converted=B.entryFromRow(row,signed),journal={...window.JOURNAL,photos:converted.photos};
    const liveRows=published.filter(r=>r.id!==row.id).map(r=>B.entryFromRow(r,signed).entry);
    const ordered=[...liveRows,converted.entry].sort((a,b)=>a.date.localeCompare(b.date));
    return window.JournalReader.documentMarkup(converted.entry,{journal,journey:window.JournalJourney,ordered},new URL('.',location.href).href);
  }
  function resizePreview(){
    const frame=$('#review-frame'),doc=frame.contentDocument;if(!doc?.body)return;
    frame.style.height='1px';frame.style.height=Math.max(600,doc.documentElement.scrollHeight,doc.body.scrollHeight)+'px';
  }
  $('#review-frame').onload=()=>{
    const doc=$('#review-frame').contentDocument;if(!doc)return;
    doc.addEventListener('click',e=>{e.preventDefault();const button=e.target.closest('.menu-toggle');if(button){const open=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!open));button.textContent=open?'Menu':'Close';doc.querySelector('#site-nav').classList.toggle('open',!open);resizePreview();}});
    doc.querySelectorAll('img').forEach(im=>{
      const fail=()=>{im.hidden=true;let fallback=im.nextElementSibling;if(!fallback?.classList.contains('preview-photo-fallback')){fallback=doc.createElement('p');fallback.className='preview-photo-fallback';fallback.textContent='This photo could not load. Choose Retry photos above.';im.after(fallback);}$('#preview-photo-status').hidden=false;$('#preview-photo-status').textContent='Some photos could not load. Your writing is still here.';resizePreview();};
      im.addEventListener('error',fail);im.addEventListener('load',resizePreview);if(im.complete&&!im.naturalWidth)fail();
    });
    doc.fonts?.ready.then(resizePreview);resizePreview();
  };
  function preview(){goStep(2);}
  $('#retry-preview-photos').onclick=()=>guard(async()=>{const fresh=await B.signedPhotos(M.usedPaths(collect()));signed={...signed,...fresh};$('#preview-photo-status').hidden=true;renderReview();});
  $('#preview-back').onclick=()=>{goStep(0,{focus:false,validate:false});window.scrollTo?.({top:writeScroll,behavior:'instant'});};
  $('#entry-new-theme').onclick=()=>{const selected=[...document.querySelectorAll('[name="entry-theme"]:checked')].map(e=>e.value);if(selected.length>=10){message('Choose up to ten themes. Uncheck one before adding another.',true);return;}O.newTheme(id=>{$('#theme-options').innerHTML=O.themeOptions([...new Set([...selected,id])]);changed();});};
  $('#write-another').onclick=()=>guard(async()=>{if(!await leaveEditor())return;await open();switchSection('editor');$('#entry-title').focus();message('A new story, ready to write.');});

  function refreshJourneyChoices(){const selected=$('#list-journey').value;$('#list-journey').innerHTML='<option value="">All sections</option>'+window.JournalJourney.periods.map(p=>`<option value="${esc(p.id)}"${selected===p.id?' selected':''}>${esc(p.title)}</option>`).join('');const selectedTheme=$('#list-theme').value;$('#list-theme').innerHTML='<option value="">All themes</option>'+window.JournalJourney.themes.map(id=>`<option value="${esc(id)}"${selectedTheme===id?' selected':''}>${esc(window.JournalJourney.themeName(id))}</option>`).join('');}
  async function loadStoryTools(){
    const probe=await db.from('journal_entries').select('themes,byline').limit(1);
    if(probe.error){if(!['42703','PGRST204'].includes(probe.error.code))throw probe.error;storyTools=false;}else storyTools=true;
    $('#story-setup').hidden=storyTools;$('#entry-metadata').hidden=!storyTools;
    organizerReady=await O.init(db,{refreshEntries:async()=>{await load();},themeCounts:()=>rows.filter(r=>r.status!=='trashed'),openSectionEntries:async(id)=>{await O.flush();$('#list-journey').value=id;switchSection('entries');drawList();message('Showing entries in this section. To place a story here, edit it and choose the section in Details & cover. Changes to published stories stay private until you update the live entry.');},openDraft:async(title,text)=>{if(!leave())return;await open();$('#entry-title').value=title.slice(0,160);blocks=[{type:'text',text}];drawBlocks();switchSection('editor');changed();message('Copied into a new draft. Your notebook page is still saved privately.');}});
    $('#entry-journey-label').hidden=!organizerReady;refreshJourneyChoices();
  }
  async function authorize(){
    const {data:{user},error}=await db.auth.getUser();if(error||!user){lock();return;}
    const check=await db.from('journal_author').select('user_id').eq('user_id',user.id).maybeSingle();if(check.error)throw check.error;if(!check.data){await db.auth.signOut();throw new Error('This account is not the journal author.');}
    await load();await loadStoryTools();$('#auth-loading').hidden=true;$('#login-panel').hidden=true;$('#workspace').hidden=false;$('#logout').hidden=false;$('#room-menu-toggle').hidden=false;await open();switchSection('entries');message('');
  }
  $('#login-form').onsubmit=async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;try{db=B.connect();const {error}=await db.auth.signInWithPassword({email:$('#email').value.trim(),password:$('#password').value});if(error)throw error;$('#password').value='';await authorize();}catch(err){message(err.message,true);}finally{btn.disabled=false;}};
  $('#room-menu-toggle').onclick=()=>{const nav=$('#room-nav'),open=!nav.classList.contains('open');nav.classList.toggle('open',open);$('#room-menu-toggle').setAttribute('aria-expanded',String(open));};
  $('#room-nav').addEventListener('click',e=>{if(e.target.closest('[data-section]')){$('#room-nav').classList.remove('open');$('#room-menu-toggle').setAttribute('aria-expanded','false');}});
  $('#cover-choices').onclick=e=>{const b=e.target.closest('[data-cover]');if(!b)return;$('#cover-photo').value=b.dataset.cover;drawPhotoLibrary(b.dataset.cover);changed();};
  $('#share-preview').onclick=()=>guard(async()=>goStep(2));
  $('#success-done').onclick=()=>{$('#editor-panel').classList.remove('just-published');$('#back-to-letters').click();};
  $('#logout').onclick=()=>guard(async()=>{if(!leave())return;await O.flush();const {error}=await db.auth.signOut();if(error)throw error;dirty=false;lock();message('Signed out.');});
  $('.writer-navigation').onclick=e=>{const b=e.target.closest('[data-section]');if(!b||busy)return;guard(async()=>{if(view==='editor'&&!await leaveEditor())return;await O.flush();switchSection(b.dataset.section);message('');});};
  $('#entry-tabs').onclick=e=>{const b=e.target.closest('[data-filter]');if(!b)return;filter=b.dataset.filter;listPage=1;drawList();};
  $('#entry-search').oninput=$('#list-theme').onchange=$('#list-from').onchange=$('#list-to').onchange=$('#list-journey').onchange=()=>{listPage=1;drawList();};$('#entry-pagination').onclick=e=>{const b=e.target.closest('[data-list-page]');if(!b)return;listPage=Number(b.dataset.listPage);drawList();$('#entry-list').scrollIntoView({block:'start'});$('#entry-pagination button:not(:disabled)')?.focus({preventScroll:true});};
  $('#clear-filters').onclick=()=>{['list-journey','list-theme','list-from','list-to'].forEach(id=>$('#'+id).value='');listPage=1;drawList();};
  $('#new-entry').onclick=()=>guard(async()=>{if(!leave())return;filter='draft';await open();switchSection('editor');$('#entry-title').focus();message('');});
  async function moveToTrash(row){
    if(!row)return;
    const warning=row.status==='published'?' This also removes it from the public journal. Undo will restore it as a private draft.':'';
    if(!confirm(`Move “${row.title}” to Trash?${warning} You can restore it later.`))return;
    const trashed=await mutate(row,{status:'trashed',deleted_at:new Date().toISOString()});
    undoTrash=trashed;$('#trash-feedback-text').textContent=`“${row.title}” moved to Trash.${row.status==='published'?' Undo restores it as a private draft.':''}`;$('#trash-feedback').hidden=false;
    await load();if(view==='editor'){await open();switchSection('entries');}message('');
  }
  $('#entry-list').onclick=e=>{
    const trash=e.target.closest('[data-trash-id]');
    if(trash){guard(()=>moveToTrash(rows.find(r=>r.id===trash.dataset.trashId)));return;}
    const b=e.target.closest('[data-id]');if(!b)return;guard(async()=>{if(!leave())return;await open(rows.find(r=>r.id===b.dataset.id));switchSection('editor');message('');});
  };
  $('#undo-trash').onclick=()=>guard(async()=>{if(!undoTrash)return;await mutate(undoTrash,{status:'draft',deleted_at:null});undoTrash=null;$('#trash-feedback').hidden=true;filter='draft';await load();message('Restored as a private draft.');});
  $('#dismiss-undo').onclick=()=>{undoTrash=null;$('#trash-feedback').hidden=true;};
  $('#entry-form').oninput=e=>{
    const t=e.target;if(t.dataset.block!==undefined){const b=blocks[Number(t.dataset.block)],field=t.dataset.field;if(field.startsWith('pair-'))b.photos[Number(field.slice(-1))]=t.value;else b[field]=t.value;}
    if(t.dataset.photo!==undefined)photos[Number(t.dataset.photo)][t.dataset.field]=t.value;
    if(t.dataset.asset){const photo=photos.find(p=>p.path===t.dataset.asset);if(photo)photo[t.dataset.assetField]=t.value;}
    if(t.tagName==='TEXTAREA')grow(t);
    if(t.type!=='file')changed();
  };
  $('#blocks').onchange=e=>{
    const t=e.target;
    if(t.dataset.insertAfter!==undefined&&t.value){if(blocks.length>=200){message('Use up to 200 blocks per entry.',true);return;}blocks.splice(Number(t.dataset.insertAfter)+1,0,M.block(t.value));changed();drawBlocks();return;}
    // Select input events update the model; repeat explicitly for older mobile browsers.
    if(t.tagName==='SELECT'&&t.dataset.block!==undefined){const b=blocks[Number(t.dataset.block)],field=t.dataset.field;if(field.startsWith('pair-'))b.photos[Number(field.slice(-1))]=t.value;else b[field]=t.value;changed();drawBlocks();}
  };
  $('#blocks').onclick=e=>{const layout=e.target.closest('[data-photo-layout]'),clear=e.target.closest('[data-clear-photo]');if(layout){const i=Number(layout.dataset.layoutIndex),b=blocks[i];if(layout.dataset.photoLayout==='pair'){if(b.type!=='pair')blocks[i]={type:'pair',photos:[b.photo,'']};}else if(b.type==='pair'){if(b.photos[1]&&blocks.length>=200){message('Remove a story section before splitting these photos.',true);return;}blocks[i]={type:'photo',photo:b.photos[0],layout:layout.dataset.photoLayout};if(b.photos[1])blocks.splice(i+1,0,{type:'photo',photo:b.photos[1],layout:layout.dataset.photoLayout});}else b.layout=layout.dataset.photoLayout;changed();drawBlocks();return;}if(clear){const b=blocks[Number(clear.dataset.clearPhoto)];if(clear.dataset.uploadSlot===undefined)b.photo='';else b.photos[Number(clear.dataset.uploadSlot)]='';changed();drawBlocks();return;}const insert=e.target.closest('[data-insert]');if(insert){if(blocks.length>=200){message('Use up to 200 story sections.',true);return;}blocks.splice(Number(insert.dataset.insert)+1,0,M.block(insert.dataset.type));changed();drawBlocks();return;}const move=e.target.closest('[data-move]'),remove=e.target.closest('[data-remove-block]');if(move){M.move(blocks,Number(move.dataset.move),Number(move.dataset.delta));changed();drawBlocks();}if(remove){const i=Number(remove.dataset.removeBlock),b=blocks[i];if((b.text||b.photo||(b.photos||[]).some(Boolean))&&!confirm('Remove this part of the story? Your uploaded photos will stay available.'))return;blocks.splice(i,1);changed();drawBlocks();}};
  $('.block-add').onclick=e=>{const b=e.target.closest('[data-add]');if(!b)return;if(blocks.length>=200){message('Use up to 200 story sections.',true);return;}blocks.push(M.block(b.dataset.add));changed();drawBlocks();const added=$('#blocks').lastElementChild;added?.querySelector('textarea,input')?.focus({preventScroll:true});added?.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});};
  $('#photo-list').onchange=e=>{if(e.target.dataset.photo!==undefined){const cover=$('#cover-photo').value;drawPhotoLibrary(cover);drawBlocks();}};
  $('#photo-list').onclick=e=>{const b=e.target.closest('[data-remove-photo]');if(!b)return;const i=Number(b.dataset.removePhoto),path=photos[i].path;if(M.usedPaths(collect()).includes(path)){message('This photo is in your story or is the cover. Remove those references before removing it from the library.',true);return;}photos.splice(i,1);changed();drawPhotoLibrary();drawBlocks();};
  $('#photo-upload').onchange=e=>{const files=[...e.target.files];if(!files.length)return;guard(async()=>{if(photos.length+files.length>20)throw new Error('Use up to 20 photos per entry.');try{for(let i=0;i<files.length;i++){message(`Uploading photo ${i+1} of ${files.length}…`);const path=await upload(files[i],draftId);photos.push({path,alt:'',caption:''});changed();}signed={...signed,...await B.signedPhotos(photos.map(p=>p.path))};drawPhotoLibrary();drawBlocks();changed();message('Photos added. You can choose them in your story or as the cover.');}finally{e.target.value='';}});};
  function validateEntry(row,options){
    try{M.validate(row,options);}catch(error){
      const field=!row.title?'#entry-title':!row.chapter_id?'#chapter':!row.entry_date?'#entry-date':/cover/.test(error.message)?'#cover-photo':'#blocks';
      goStep(['#entry-date','#cover-photo'].includes(field)?1:0,{focus:false,validate:false});
      const target=$(field);target.insertAdjacentElement?.('afterend',$('#entry-error'));if(field==='#blocks')target.setAttribute('tabindex','-1');$('#entry-error').hidden=false;$('#entry-error').textContent=error.message;
      target.setAttribute('aria-describedby','entry-error');target.scrollIntoView?.({behavior:'smooth',block:'center'});target.focus();throw error;
    }
  }
  $('#entry-form').onsubmit=e=>{e.preventDefault();guard(async()=>{
    if(e.submitter?.value!=='publish')return save(false);
    if(editorStep===0){goStep(1);return;}
    validateEntry(collect());await save(true);
  });};
  $('#guided-next').onclick=()=>guard(async()=>goStep(editorStep+1));
  $('#guided-back').onclick=()=>guard(async()=>goStep(Math.max(0,editorStep-1)));
  for(const [index,id] of ['step-write','step-details','step-review'].entries())$('#'+id).onclick=()=>guard(async()=>goStep(index));
  $('#preview').onclick=()=>guard(preview);
  for(const mode of ['desktop','mobile'])$('#preview-'+mode).onclick=()=>{previewMode=mode;$('#review-step').classList.toggle('phone-preview',mode==='mobile');['desktop','mobile'].forEach(m=>$('#preview-'+m).setAttribute('aria-pressed',String(m===mode)));resizePreview();};
  $('#unpublish').onclick=()=>guard(async()=>{if(!current||!leave()||!confirm('Remove this entry from the public journal and keep it as a private draft?'))return;const data=await mutate(current,{status:'draft'});filter='draft';await load();await open(data);message('Unpublished. Your entry is now a private draft.');});
  $('#trash-entry').onclick=()=>guard(async()=>{if(!current||!leave())return;await moveToTrash(current);});
  $('#trash-list').onclick=e=>{const restore=e.target.closest('[data-restore]'),del=e.target.closest('[data-delete]');if(!restore&&!del)return;guard(async()=>{const row=rows.find(r=>r.id===(restore?.dataset.restore||del.dataset.delete));if(restore){await mutate(row,{status:'draft',deleted_at:null});message('Restored as a private draft. Find it under Entries → Drafts.');}else{if(!confirm(`Permanently delete “${row.title}”? This cannot be undone.`))return;const {data,error}=await db.from('journal_entries').delete().eq('id',row.id).eq('status','trashed').eq('updated_at',row.updated_at).select('id');if(error)throw error;if(!data.length)throw new Error('This entry changed. Refresh before deleting.');message('Entry permanently deleted.');}await load();});};
  $('#back-to-letters').onclick=()=>guard(async()=>{if(!await leaveEditor())return;switchSection('entries');drawList();message('');});
  function updateYearHint(){const p=window.JournalJourney?.forEntry({date:$('#entry-date').value,journeyId:$('#entry-journey').value});$('#entry-year-hint').textContent=p?`This story will appear in ${p.title}. Use the experience’s date when writing about an earlier memory.`:'Use the date of the experience. Dates outside the mission years remain available under All entries.';}
  $('#entry-journey').onchange=()=>{updateYearHint();changed();};
  $('#entry-date').onchange=()=>{updateYearHint();changed();};
  $('#cover-photo').onchange=()=>{drawPhotoLibrary($('#cover-photo').value);changed();};
  $('#remove-cover').onclick=()=>{drawPhotoLibrary('');changed();};
  $('#cover-upload').onchange=e=>{const file=e.target.files[0];if(!file)return;guard(async()=>{try{await addDirectPhoto(file,null,null,true);}finally{e.target.value='';}});};
  async function addDirectPhoto(file,index,slot=null,cover=false){
    if(photos.length>=20)throw new Error('This entry has 20 uploaded photos. Remove an unused photo under Your uploaded photos before adding another.');
    message('Adding your photo…');const path=await upload(file,draftId);photos.push({path,alt:'',caption:''});
    if(!cover){if(slot===null)blocks[index].photo=path;else blocks[index].photos[slot]=path;}
    changed();signed={...signed,...await B.signedPhotos([path])};
    const chosen=cover?path:$('#cover-photo').value;
    drawPhotoLibrary(chosen);drawBlocks();changed();message('Photo added. Add a caption below it if you like.');
  }
  $('#blocks').addEventListener('change',e=>{
    const t=e.target;if(t.dataset.inlineUpload===undefined||!t.files?.length)return;
    const index=Number(t.dataset.inlineUpload),slot=t.dataset.uploadSlot===undefined?null:Number(t.dataset.uploadSlot),file=t.files[0];
    guard(async()=>{try{await addDirectPhoto(file,index,slot);}finally{t.value='';}});
  });
  window.addEventListener('resize',()=>{if(editorStep===2)resizePreview();if(view==='editor'&&editorStep===0)document.querySelectorAll('#blocks textarea').forEach(grow);});
  window.addEventListener('beforeunload',e=>{if(dirty||O.dirty){e.preventDefault();e.returnValue='';}});

  let cropImage=null,cropSource=null,cropRect=null,cropBounds=null,cropDrag=null;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function fitCrop(){
    const c=$('#crop-canvas'),scale=Math.min(c.width/cropImage.naturalWidth,c.height/cropImage.naturalHeight);
    const w=cropImage.naturalWidth*scale,h=cropImage.naturalHeight*scale;
    cropBounds={x:(c.width-w)/2,y:(c.height-h)/2,w,h};
    const width=Math.min(w,h*3);cropRect={x:(c.width-width)/2,y:(c.height-width/3)/2,w:width,h:width/3};$('#crop-size').value=100;paintCrop();
  }
  function constrainCrop(){const b=cropBounds,r=cropRect;r.x=clamp(r.x,b.x,b.x+b.w-r.w);r.y=clamp(r.y,b.y,b.y+b.h-r.h);}
  function sizeCrop(percent){const r=cropRect,cx=r.x+r.w/2,cy=r.y+r.h/2;r.w=Math.min(cropBounds.w,cropBounds.h*3)*percent/100;r.h=r.w/3;r.x=cx-r.w/2;r.y=cy-r.h/2;constrainCrop();$('#crop-size').value=percent;paintCrop();}
  function paintCrop(canvas=$('#crop-canvas')){
    if(!cropImage||!cropRect)return;
    const ctx=canvas.getContext('2d'),r=cropRect,b=cropBounds;
    if(canvas!==$('#crop-canvas')){const scale=cropImage.naturalWidth/b.w;ctx.drawImage(cropImage,(r.x-b.x)*scale,(r.y-b.y)*scale,r.w*scale,r.h*scale,0,0,canvas.width,canvas.height);return;}
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(cropImage,b.x,b.y,b.w,b.h);
    ctx.fillStyle='rgba(37,29,23,.56)';ctx.beginPath();ctx.rect(0,0,canvas.width,canvas.height);ctx.rect(r.x,r.y,r.w,r.h);ctx.fill('evenodd');
    ctx.strokeStyle='#fffaf2';ctx.lineWidth=3;ctx.strokeRect(r.x,r.y,r.w,r.h);ctx.lineWidth=1;ctx.strokeStyle='#fff9';
    for(let i=1;i<3;i++){ctx.beginPath();ctx.moveTo(r.x+r.w*i/3,r.y);ctx.lineTo(r.x+r.w*i/3,r.y+r.h);ctx.moveTo(r.x,r.y+r.h*i/3);ctx.lineTo(r.x+r.w,r.y+r.h*i/3);ctx.stroke();}
    ctx.fillStyle='#fffaf2';for(const x of [r.x,r.x+r.w])for(const y of [r.y,r.y+r.h]){ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fill();}
  }
  const cropCanvas=$('#crop-canvas');
  function cropPoint(e){const b=cropCanvas.getBoundingClientRect();return {x:(e.clientX-b.left)*cropCanvas.width/b.width,y:(e.clientY-b.top)*cropCanvas.height/b.height};}
  cropCanvas.onpointerdown=e=>{if(busy||!cropRect)return;const p=cropPoint(e),r=cropRect,t=24*cropCanvas.width/cropCanvas.getBoundingClientRect().width;let corner=null;for(const sx of [0,1])for(const sy of [0,1])if(Math.hypot(p.x-r.x-sx*r.w,p.y-r.y-sy*r.h)<t)corner={sx,sy};if(!corner&&(p.x<r.x||p.x>r.x+r.w||p.y<r.y||p.y>r.y+r.h))return;e.preventDefault();cropCanvas.focus();cropCanvas.setPointerCapture(e.pointerId);cropDrag={p,r:{...r},corner};};
  cropCanvas.onpointermove=e=>{if(!cropDrag||busy)return;const p=cropPoint(e),d=cropDrag,r=cropRect,b=cropBounds;if(d.corner){const {sx,sy}=d.corner,ax=d.r.x+(1-sx)*d.r.w,ay=d.r.y+(1-sy)*d.r.h;const max=Math.min(sx?b.x+b.w-ax:ax-b.x,(sy?b.y+b.h-ay:ay-b.y)*3);const width=clamp(((p.x-ax)*(sx?1:-1)+(p.y-ay)*(sy?1:-1)*3)/2,Math.min(b.w,b.h*3)*.2,max);r.w=width;r.h=width/3;r.x=sx?ax:ax-width;r.y=sy?ay:ay-r.h;$('#crop-size').value=width/Math.min(b.w,b.h*3)*100;}else{r.x=d.r.x+p.x-d.p.x;r.y=d.r.y+p.y-d.p.y;}constrainCrop();paintCrop();};
  cropCanvas.onpointerup=cropCanvas.onpointercancel=()=>{cropDrag=null;};
  cropCanvas.onkeydown=e=>{if(!cropRect||busy)return;const step=e.shiftKey?15:3;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();cropRect.x+=(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0);cropRect.y+=(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0);constrainCrop();paintCrop();}else if(['+','=','-'].includes(e.key)){e.preventDefault();sizeCrop(clamp(Number($('#crop-size').value)+(e.key==='-'?-5:5),20,100));}};
  $('#crop-cover').onclick=()=>guard(async()=>{
    const chosen=photos.find(p=>p.path===($('#cover-photo').value||firstStoryPhoto()));if(!chosen)return;
    cropSource=photos.find(p=>p.path===chosen.coverOriginal)||chosen;$('#crop-error').textContent='';
    cropImage=new Image();cropImage.crossOrigin='anonymous';cropImage.src=signed[cropSource.path];await cropImage.decode();fitCrop();$('#cover-crop-dialog').showModal();
  });
  $('#crop-size').oninput=e=>sizeCrop(Number(e.target.value));$('#crop-reset').onclick=fitCrop;
  $('#crop-cancel').onclick=$('#crop-close').onclick=()=>$('#cover-crop-dialog').close();
  $('#crop-save').onclick=()=>guard(async()=>{
    try{
      if(photos.length>=20)throw new Error('Remove an unused photo before saving another cover crop.');
      const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=600;paintCrop(canvas);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.94));if(!blob)throw new Error('Could not create this crop. Please try again.');
      const path=`${draftId}/${crypto.randomUUID()}-cover.jpg`;
      const result=await db.storage.from('journal-photos').upload(path,blob,{contentType:'image/jpeg',upsert:false});if(result.error)throw result.error;
      const fresh=await B.signedPhotos([path]);
      photos.push({path,alt:cropSource.alt||'',caption:cropSource.caption||'',coverOnly:true,coverOriginal:cropSource.path});signed={...signed,...fresh};
      drawPhotoLibrary(path);changed();$('#cover-crop-dialog').close();message('Cover crop saved. Your original photo is unchanged.');
    }catch(e){$('#crop-error').textContent=e.message;}
  });

  async function init(){if(!B.configured){lock();message('Connect your Supabase project before signing in.');return;}try{db=B.connect();db.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')lock();});await authorize();}catch(e){lock();message(e.message,true);}}
  document.addEventListener('click',e=>{document.querySelectorAll('details.more-menu[open],details.block-menu[open]').forEach(d=>{if(!d.contains(e.target))d.removeAttribute('open');});});
  init();
})();
