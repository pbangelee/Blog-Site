(() => {
  const $=s=>document.querySelector(s), B=window.JournalBackend, M=window.JournalEditorModel, esc=B.escape;
  let db,rows=[],chapters=[],published=[],current=null,draftId=crypto.randomUUID(),photos=[],blocks=[],signed={},dirty=false,busy=false,filter='draft',chapterEditing=null,chapterDeleting=null,view='entries',autoTimer=null,editVersion=0;
  function message(text,error=false){$('#status').textContent=text;$('#status').classList.toggle('error',error);}
  function working(on){busy=on;$('#workspace').setAttribute('aria-busy',String(on));document.querySelectorAll('#workspace button,#workspace input,#workspace textarea,#workspace select,dialog button,dialog input,dialog textarea,dialog select').forEach(e=>e.disabled=on);$('#logout').disabled=on;}
  async function guard(fn){if(busy)return;working(true);try{await fn();}catch(e){message(e.message||'Something went wrong. Please try again.',true);}finally{working(false);}}
  function date(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function leave(){return !dirty||confirm('Leave this letter without saving your latest changes?');}
  function scheduleAutosave(){
    clearTimeout(autoTimer);
    if(!dirty||view!=='editor'||$('#workspace').hidden)return;
    autoTimer=setTimeout(async()=>{
      if(busy){scheduleAutosave();return;}
      try{M.validate(collect(),{draft:true});}catch(_){$('#save-state').textContent='Finish the title and story to save';return;}
      busy=true;
      try{await save(false,true);}catch(e){$('#save-state').textContent='Could not save — use Save for later';message('Your latest changes are still on this page. '+e.message,true);}
      finally{busy=false;}
    },3500);
  }
  function changed(){dirty=true;editVersion++;$('#save-state').textContent='Unsaved changes';$('#save-state').classList.add('unsaved');scheduleAutosave();}
  function lock(){clearTimeout(autoTimer);$('#workspace').hidden=true;$('#logout').hidden=true;$('#login-panel').hidden=false;document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
  function publicVersion(id){return published.find(e=>e.id===id);}
  function hasRevision(row){const live=publicVersion(row.id);return live&&live.updated_at!==row.updated_at;}
  function chapterOptions(selected='',all=false){return (all?'<option value="">All chapters</option>':'')+chapters.map(c=>`<option value="${esc(c.id)}"${selected===c.id?' selected':''}>${esc(c.title)}</option>`).join('');}
  async function load(){
    const results=await Promise.all([db.from('journal_entries').select('*').order('entry_date',{ascending:false}),db.from('journal_chapters').select('*').order('sort_order').order('id'),db.from('journal_public_entries').select('id,updated_at')]);
    results.forEach(r=>{if(r.error)throw new Error(r.error.message+' If you just upgraded, run backend/upgrade-writing-room.sql first.');});
    rows=results[0].data;chapters=results[1].data;published=results[2].data;
    signed={...signed,...await B.signedPhotos([...chapters.map(c=>c.image_path),...rows.filter(r=>r.status!=='trashed').map(r=>r.cover_path)])};
    const chosen=$('#chapter').value,listChosen=$('#list-chapter').value;
    $('#chapter').innerHTML=chapterOptions(chosen);$('#list-chapter').innerHTML=chapterOptions(listChosen,true);
    drawList();drawChapters();drawTrash();
  }
  function drawList(){
    const search=$('#entry-search').value.trim().toLowerCase(),chapter=$('#list-chapter').value;
    $('#draft-count').textContent=rows.filter(r=>r.status==='draft').length;$('#published-count').textContent=rows.filter(r=>r.status==='published').length;$('#trash-count').textContent=rows.filter(r=>r.status==='trashed').length;
    document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));
    const visible=rows.filter(r=>r.status===filter&&r.title.toLowerCase().includes(search)&&(!chapter||r.chapter_id===chapter));
    $('#entry-list').innerHTML=visible.map(r=>{
      const chapter=chapters.find(c=>c.id===r.chapter_id),thumb=signed[r.cover_path]||chapter?.sample_image||'images/hero-ocean.jpg';
      return `<article class="letter-card"><img src="${esc(thumb)}" alt="" width="400" height="260" loading="lazy"><div class="letter-card-content"><div class="letter-card-meta"><span class="status-badge ${r.status}">${r.status==='draft'?'DRAFT':'PUBLISHED'}</span><span>${esc(chapter?.title||'')}</span></div><h2>${esc(r.title)}</h2><p class="letter-edited">Edited ${new Date(r.updated_at).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</p>${hasRevision(r)?'<p class="revision-note">Saved changes haven’t been shared yet.</p>':''}<button type="button" class="letter-open" data-id="${esc(r.id)}">${r.status==='draft'?'Continue writing':'Edit letter'} <span aria-hidden="true">↗</span></button>${r.status==='published'?`<a class="letter-live" target="_blank" rel="noopener" href="entry.html?id=${encodeURIComponent(r.id)}">View live letter ↗</a>`:''}</div></article>`;
    }).join('')||`<div class="letters-empty"><p class="hand">${filter==='draft'?'a fresh page is waiting':'one story at a time'}</p><h2>${search||chapter?'No matching letters':filter==='draft'?'Your next letter starts here.':'Nothing shared just yet.'}</h2><p>${search||chapter?'Try another title or chapter.':filter==='draft'?'Choose New letter to begin writing.':'Publish a letter when you’re ready. It will appear here.'}</p></div>`;
  }
  async function open(row=null){
    clearTimeout(autoTimer);editVersion++;if(!row){$('#entry-details').open=false;$('.photo-library').open=false;}
    current=row?structuredClone(row):null;draftId=row?.id||crypto.randomUUID();photos=structuredClone(row?.photos||[]);blocks=row?M.legacyBlocks(row):[M.block('text')];
    $('#entry-form').reset();$('#entry-title').value=row?.title||'';$('#excerpt').value=row?.excerpt||'';$('#entry-date').value=row?.entry_date||date();$('#chapter').innerHTML=chapterOptions(row?.chapter_id||chapters[0]?.id);
    $('#editor-heading').textContent=row?(row.status==='published'?'Your published letter':'Your draft'):'A new letter';
    $('#status-badge').textContent=row?.status==='published'?'PUBLISHED':'DRAFT';$('#status-badge').className='status-badge '+(row?.status||'draft');
    $('#save-state').textContent=row?`All changes saved${hasRevision(row)?' · not shared yet':''}`:'Not saved yet';$('#save-state').classList.remove('unsaved');
    $('#published-note').hidden=row?.status!=='published';$('#save-draft').textContent='Save for later';$('#publish').textContent=row?.status==='published'?'Update live letter ↗':'Publish letter ↗';$('#unpublish').hidden=row?.status!=='published';$('#trash-entry').hidden=!row;$('.more-entry-options').hidden=!row;
    $('#view-entry').hidden=row?.status!=='published';$('#view-entry').href=row?`entry.html?id=${encodeURIComponent(row.id)}`:'#';
    signed={...signed,...await B.signedPhotos(photos.map(p=>p.path))};dirty=false;drawPhotoLibrary(row?.cover_path||'');drawBlocks();drawList();
  }
  function photoOptions(selected='',blank='Choose a photo'){return `<option value="">${blank}</option>`+photos.map((p,i)=>`<option value="${esc(p.path)}"${p.path===selected?' selected':''}>${i+1}. ${esc(p.alt||p.caption||'Photo '+(i+1))}</option>`).join('');}
  function photoPreview(path){return path&&signed[path]?`<img class="block-photo-preview" src="${esc(signed[path])}" alt="Selected story photo" width="500" height="350">`:'';}
  function insertion(after){return `<details class="add-story-menu between-story"><summary>+ Add to your story</summary><div class="add-choices">${[['text','Text','A new paragraph'],['photo','Photo','Upload a picture here'],['pair','Two photos','Side by side'],['quote','Quote','A thought to remember']].map(([type,label,hint])=>`<button type="button" data-insert="${after}" data-type="${type}"><strong>${label}</strong><span>${hint}</span></button>`).join('')}</div></details>`;}
  function photoFields(i,path,slot=null){
    const photo=photos.find(p=>p.path===path),field=slot===null?'photo':`pair-${slot}`;
    const uploadIndex=slot===null?'':` data-upload-slot="${slot}"`;
    return `<div class="inline-photo">${photoPreview(path)}<label class="inline-upload ${path?'has-photo':''}"><span>${path?'Replace photo':slot===null?'Choose a photo':slot===0?'Choose left photo':'Choose right photo'}</span><input type="file" data-inline-upload="${i}"${uploadIndex} accept="image/jpeg,image/png,image/webp"></label>${photo?`<label class="inline-caption"><span class="sr-only">Photo caption</span><input data-asset="${esc(path)}" data-asset-field="caption" maxlength="500" placeholder="Add a caption…" value="${esc(photo.caption||'')}"></label>`:''}<details class="photo-settings"><summary>${path?'Photo options':'Or use an uploaded photo'}</summary><label>Choose from your photos<select data-block="${i}" data-field="${field}">${photoOptions(path)}</select></label>${photo?`<label>Describe this photo<input data-asset="${esc(path)}" data-asset-field="alt" maxlength="300" placeholder="A description for readers who can’t see the image" value="${esc(photo.alt||'')}"></label>`:''}${slot===null?`<label>Photo size<select data-block="${i}" data-field="layout"><option value="full"${blocks[i].layout!=='center'?' selected':''}>Full width</option><option value="center"${blocks[i].layout==='center'?' selected':''}>Smaller, centered</option></select></label>`:''}</details></div>`;
  }
  function drawBlocks(){
    $('#blocks').innerHTML=blocks.map((b,i)=>{
      let fields='';
      if(b.type==='text')fields=`<label class="story-text"><span class="sr-only">Story text</span><textarea rows="5" maxlength="100000" placeholder="${i===0?'Dear family and friends…':'Keep the story going…'}" data-block="${i}" data-field="text">${esc(b.text)}</textarea></label>`;
      if(b.type==='quote')fields=`<label class="story-quote"><span class="sr-only">Quote</span><textarea rows="3" maxlength="5000" placeholder="A thought worth remembering…" data-block="${i}" data-field="text">${esc(b.text)}</textarea></label><label class="quote-author"><span class="sr-only">Who said it</span><input maxlength="200" placeholder="Who said it? (optional)" data-block="${i}" data-field="attribution" value="${esc(b.attribution)}"></label>`;
      if(b.type==='photo')fields=photoFields(i,b.photo);
      if(b.type==='pair')fields=`<div class="inline-photo-pair">${[0,1].map(n=>photoFields(i,b.photos[n],n)).join('')}</div>`;
      return `<section class="story-block story-${b.type}" data-block-card="${i}" aria-label="${b.type==='pair'?'Two photos':b.type} section ${i+1}"><details class="story-options"><summary aria-label="Options for section ${i+1}">⋯</summary><div><button type="button" data-move="${i}" data-delta="-1"${i===0?' disabled':''}>↑ Move up</button><button type="button" data-move="${i}" data-delta="1"${i===blocks.length-1?' disabled':''}>↓ Move down</button><button type="button" class="danger" data-remove-block="${i}">Remove section</button></div></details>${fields}</section>${i<blocks.length-1?insertion(i):''}`;
    }).join('');
    document.querySelectorAll('#blocks textarea').forEach(grow);
  }
  function grow(textarea){textarea.style.height='auto';textarea.style.height=Math.max(140,textarea.scrollHeight||140)+'px';}
  function drawPhotoLibrary(cover=$('#cover-photo').value){
    $('#cover-photo').innerHTML=photoOptions(cover,'Use sample illustration');$('#cover-preview').innerHTML=photoPreview(cover);
    $('#photo-list').innerHTML=photos.map((p,i)=>`<div class="writer-photo"><p class="meta">PHOTO ${i+1}</p><img src="${esc(signed[p.path]||'')}" alt="${esc(p.alt||'Uploaded photo')}" width="400" height="300"><label>Description<input data-photo="${i}" data-field="alt" maxlength="300" value="${esc(p.alt||'')}"></label><label>Caption<input data-photo="${i}" data-field="caption" maxlength="500" value="${esc(p.caption||'')}"></label><button class="v-btn danger" type="button" data-remove-photo="${i}">Remove photo</button></div>`).join('')||'<p class="field-help">No photos yet. Upload one above.</p>';
  }
  function collect(){
    const content=blocks.filter(b=>b.type==='text'||b.type==='quote').map(b=>b.text).filter(Boolean).join('\n\n')||'Photo journal';
    return {id:draftId,title:$('#entry-title').value.trim(),chapter_id:$('#chapter').value,entry_date:$('#entry-date').value,excerpt:$('#excerpt').value.trim()||content.slice(0,180),content,photos:structuredClone(photos),blocks:structuredClone(blocks),cover_path:$('#cover-photo').value||null,status:current?.status==='published'?'published':'draft',deleted_at:null};
  }
  async function save(publish=false,quiet=false){
    clearTimeout(autoTimer);const revision=editVersion;const row=collect();M.validate(row,{draft:!publish});$('#save-state').textContent='Saving…';
    const query=current?db.from('journal_entries').update(row).eq('id',row.id).eq('updated_at',current.updated_at).select().maybeSingle():db.from('journal_entries').insert(row).select().single();
    let {data,error}=await query;if(error)throw error;if(!data)throw new Error('This entry changed in another tab. Your text is still here; reload before saving again.');
    current=data;dirty=editVersion!==revision;
    if(publish){const result=await db.rpc('publish_journal_entry',{entry_id:data.id,expected_updated_at:data.updated_at});if(result.error){$('#save-state').textContent='Changes saved privately; publishing failed';throw new Error('Your changes were saved privately, but publishing failed: '+result.error.message);}data=Array.isArray(result.data)?result.data[0]:result.data;if(!data)throw new Error("Publishing returned no entry. Refresh to check its status.");current=data;}
    if(quiet){
      const index=rows.findIndex(r=>r.id===data.id);if(index<0)rows.unshift(data);else rows[index]=data;
      $('#save-state').textContent=dirty?'Unsaved changes':`All changes saved${data.status==='published'?' · not shared yet':''}`;$('#save-state').classList.toggle('unsaved',dirty);
      $('#trash-entry').hidden=false;$('.more-entry-options').hidden=false;drawList();if(dirty)scheduleAutosave();return;
    }
    filter=data.status;await load();await open(data);message(publish?'Published. Your updated letter is now on the journal.':data.status==='published'?'Changes saved privately. The published version has not changed.':'Draft saved. Only you can read it.');
  }
  async function mutate(row,patch){const {data,error}=await db.from('journal_entries').update(patch).eq('id',row.id).eq('updated_at',row.updated_at).select().maybeSingle();if(error)throw error;if(!data)throw new Error('This entry changed in another tab. Refresh before continuing.');return data;}
  function drawTrash(){
    $('#trash-list').innerHTML=rows.filter(r=>r.status==='trashed').map(r=>`<article class="trash-row"><div><span class="status-badge trashed">TRASH</span><h2>${esc(r.title)}</h2><p class="field-help">Moved here ${new Date(r.deleted_at||r.updated_at).toLocaleDateString()}</p></div><div><button type="button" class="v-btn" data-restore="${r.id}">Restore as draft</button><button type="button" class="v-btn danger" data-delete="${r.id}">Delete permanently</button></div></article>`).join('')||'<p class="empty-panel">Nothing in Trash.</p>';
  }
  function drawChapters(){
    $('#chapter-list').innerHTML=chapters.map((c,i)=>`<article class="chapter-manager-card"><img src="${esc(signed[c.image_path]||c.sample_image||'images/hero-ocean.jpg')}" alt="" width="400" height="260"><div><p class="meta">CHAPTER ${i+1} · ${rows.filter(r=>r.chapter_id===c.id&&r.status!=='trashed').length} ENTRIES</p><h2>${esc(c.title)}</h2><p>${esc(c.description)}</p><div class="chapter-actions"><button class="v-btn" type="button" data-edit-chapter="${c.id}">Edit chapter</button><button class="v-btn" type="button" data-order="${i}" data-delta="-1" aria-label="Move ${esc(c.title)} up"${i===0?' disabled':''}>↑</button><button class="v-btn" type="button" data-order="${i}" data-delta="1" aria-label="Move ${esc(c.title)} down"${i===chapters.length-1?' disabled':''}>↓</button><button class="text-button danger" type="button" data-delete-chapter="${c.id}">Delete</button></div></div></article>`).join('');
  }
  function showChapter(c=null){chapterEditing=c;$('#chapter-form').reset();$('#chapter-title').value=c?.title||'';$('#chapter-description').value=c?.description||'';$('#chapter-intro').value=c?.intro||'';$('#chapter-dialog-title').textContent=c?'Edit chapter':'A new chapter';$('#chapter-cover-note').textContent=c?.image_path?'Your current cover stays unless you upload another.':'A sample illustration is used until you add a cover.';$('#chapter-dialog').showModal();}
  async function compress(file){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose JPEG, PNG or WebP photos.');if(file.size>10485760)throw new Error('Choose photos smaller than 10 MB each.');
    const bitmap=await createImageBitmap(file),scale=Math.min(1,1800/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('This photo could not be prepared.')),'image/jpeg',.86));
  }
  async function upload(file,prefix){const blob=await compress(file),path=`${prefix}/${crypto.randomUUID()}.jpg`;const {error}=await db.storage.from('journal-photos').upload(path,blob,{contentType:'image/jpeg',upsert:false});if(error)throw error;return path;}
  function switchSection(section){
    view=section;
    document.querySelectorAll('[data-section]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.section===section)));
    ['entries','editor','chapters','trash'].forEach(s=>$('#'+s+'-panel').hidden=s!==section);
    $('#workspace').classList.toggle('writing-mode',section==='editor');
    if(section==='editor'){scheduleAutosave();}else clearTimeout(autoTimer);
    window.scrollTo?.({top:0,behavior:'instant'});
  }
  async function preview(){
    const row=collect();M.validate(row);const converted=B.entryFromRow(row,signed),entry=converted.entry,ph=converted.photos;
    const figure=(id,cls='')=>{const p=ph[id];return `<figure class="${cls}"><img src="${esc(p.src)}" alt="${esc(p.alt)}">${p.caption?`<figcaption>${p.caption}</figcaption>`:''}</figure>`;};
    const body=entry.body.map(b=>b.type==='p'?`<p>${b.text}</p>`:b.type==='quote'?`<blockquote class="journal-quote"><p>${b.text}</p><cite>${b.attribution}</cite></blockquote>`:b.type==='photo'?figure(b.id,b.layout==='center'?'photo-centered':'wide'):`<div class="photo-group">${b.ids.map(id=>figure(id)).join('')}</div>`).join('');
    const css=esc(new URL('css/styles.css',location.href).href);
    const chapter=chapters.find(c=>c.id===row.chapter_id);
    $('#preview-frame').srcdoc=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${esc(new URL('.',location.href).href)}"><link rel="stylesheet" href="${css}"></head><body><article class="container entry"><header class="entry-head"><p class="meta">${esc(chapter?.title||'')} · ${esc(row.entry_date)}</p><h1>${entry.title}</h1></header>${figure(entry.cover,'cover')}<div class="prose">${body}</div></article></body></html>`;$('#preview-dialog').showModal();
  }
  async function authorize(){
    const {data:{user},error}=await db.auth.getUser();if(error||!user){lock();return;}
    const check=await db.from('journal_author').select('user_id').eq('user_id',user.id).maybeSingle();if(check.error)throw check.error;if(!check.data){await db.auth.signOut();throw new Error('This account is not the journal author.');}
    await load();$('#login-panel').hidden=true;$('#workspace').hidden=false;$('#logout').hidden=false;await open();switchSection('entries');message('');
  }
  $('#login-form').onsubmit=async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;try{db=B.connect();const {error}=await db.auth.signInWithPassword({email:$('#email').value.trim(),password:$('#password').value});if(error)throw error;$('#password').value='';await authorize();}catch(err){message(err.message,true);}finally{btn.disabled=false;}};
  $('#logout').onclick=()=>guard(async()=>{if(!leave())return;const {error}=await db.auth.signOut();if(error)throw error;dirty=false;lock();message('Signed out.');});
  $('.writer-navigation').onclick=e=>{const b=e.target.closest('[data-section]');if(!b||busy)return;switchSection(b.dataset.section);};
  $('#entry-tabs').onclick=e=>{const b=e.target.closest('[data-filter]');if(!b)return;filter=b.dataset.filter;drawList();};
  $('#entry-search').oninput=drawList;$('#list-chapter').onchange=drawList;
  $('#new-entry').onclick=()=>guard(async()=>{if(!leave())return;filter='draft';await open();switchSection('editor');$('#entry-title').focus();message('A fresh page, just for you.');});
  $('#entry-list').onclick=e=>{const b=e.target.closest('[data-id]');if(!b)return;guard(async()=>{if(!leave())return;await open(rows.find(r=>r.id===b.dataset.id));switchSection('editor');message('');});};
  $('#entry-form').oninput=e=>{
    const t=e.target;if(t.dataset.block!==undefined){const b=blocks[Number(t.dataset.block)],field=t.dataset.field;if(field.startsWith('pair-'))b.photos[Number(field.slice(-1))]=t.value;else b[field]=t.value;}
    if(t.dataset.photo!==undefined)photos[Number(t.dataset.photo)][t.dataset.field]=t.value;
    if(t.dataset.asset){const photo=photos.find(p=>p.path===t.dataset.asset);if(photo)photo[t.dataset.assetField]=t.value;}
    if(t.tagName==='TEXTAREA')grow(t);
    if(t.type!=='file')changed();
  };
  $('#blocks').onchange=e=>{
    const t=e.target;
    if(t.dataset.insertAfter!==undefined&&t.value){if(blocks.length>=200){message('Use up to 200 blocks per letter.',true);return;}blocks.splice(Number(t.dataset.insertAfter)+1,0,M.block(t.value));changed();drawBlocks();return;}
    // Select input events update the model; repeat explicitly for older mobile browsers.
    if(t.tagName==='SELECT'&&t.dataset.block!==undefined){const b=blocks[Number(t.dataset.block)],field=t.dataset.field;if(field.startsWith('pair-'))b.photos[Number(field.slice(-1))]=t.value;else b[field]=t.value;changed();drawBlocks();}
  };
  $('#blocks').onclick=e=>{const insert=e.target.closest('[data-insert]');if(insert){if(blocks.length>=200){message('Use up to 200 story sections.',true);return;}blocks.splice(Number(insert.dataset.insert)+1,0,M.block(insert.dataset.type));changed();drawBlocks();return;}const move=e.target.closest('[data-move]'),remove=e.target.closest('[data-remove-block]');if(move){M.move(blocks,Number(move.dataset.move),Number(move.dataset.delta));changed();drawBlocks();}if(remove){const i=Number(remove.dataset.removeBlock),b=blocks[i];if((b.text||b.photo||(b.photos||[]).some(Boolean))&&!confirm('Remove this part of the story? Your uploaded photos will stay available.'))return;blocks.splice(i,1);changed();drawBlocks();}};
  $('.block-add').onclick=e=>{const b=e.target.closest('[data-add]');if(!b)return;if(blocks.length>=200){message('Use up to 200 story sections.',true);return;}blocks.push(M.block(b.dataset.add));$('.block-add').querySelector('details').open=false;changed();drawBlocks();$('#blocks').lastElementChild?.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});};
  $('#photo-list').onchange=e=>{if(e.target.dataset.photo!==undefined){const cover=$('#cover-photo').value;drawPhotoLibrary(cover);drawBlocks();}};
  $('#photo-list').onclick=e=>{const b=e.target.closest('[data-remove-photo]');if(!b)return;const i=Number(b.dataset.removePhoto),path=photos[i].path;if(M.usedPaths(collect()).includes(path)){message('This photo is in your story or is the cover. Remove those references before removing it from the library.',true);return;}photos.splice(i,1);changed();drawPhotoLibrary();drawBlocks();};
  $('#photo-upload').onchange=e=>{const files=[...e.target.files];if(!files.length)return;guard(async()=>{if(photos.length+files.length>20)throw new Error('Use up to 20 photos per entry.');try{for(let i=0;i<files.length;i++){message(`Uploading photo ${i+1} of ${files.length}…`);const path=await upload(files[i],draftId);photos.push({path,alt:'',caption:''});changed();}signed={...signed,...await B.signedPhotos(photos.map(p=>p.path))};drawPhotoLibrary();drawBlocks();changed();message('Photos added. You can choose them in your story or as the cover.');}finally{e.target.value='';}});};
  $('#entry-form').onsubmit=e=>{e.preventDefault();guard(()=>save(e.submitter?.value==='publish'));};
  $('#preview').onclick=()=>guard(preview);
  $('#preview-close').onclick=()=>$('#preview-dialog').close();
  for(const mode of ['desktop','mobile'])$('#preview-'+mode).onclick=()=>{$('#preview-dialog').classList.toggle('mobile-preview',mode==='mobile');['desktop','mobile'].forEach(m=>$('#preview-'+m).setAttribute('aria-pressed',String(m===mode)));};
  $('#unpublish').onclick=()=>guard(async()=>{if(!current||!leave()||!confirm('Remove this letter from the public journal and keep it as a private draft?'))return;const data=await mutate(current,{status:'draft'});filter='draft';await load();await open(data);message('Unpublished. Your letter is now a private draft.');});
  $('#trash-entry').onclick=()=>guard(async()=>{if(!current||!leave()||!confirm('Move this letter to Trash? If published, it will disappear from the journal. You can restore it later.'))return;await mutate(current,{status:'trashed',deleted_at:new Date().toISOString()});await load();await open();switchSection('entries');message('Moved to Trash. You can restore it from the Trash section.');});
  $('#trash-list').onclick=e=>{const restore=e.target.closest('[data-restore]'),del=e.target.closest('[data-delete]');if(!restore&&!del)return;guard(async()=>{const row=rows.find(r=>r.id===(restore?.dataset.restore||del.dataset.delete));if(restore){await mutate(row,{status:'draft',deleted_at:null});message('Restored as a private draft. Find it under Entries → Drafts.');}else{if(!confirm(`Permanently delete “${row.title}”? This cannot be undone.`))return;const {data,error}=await db.from('journal_entries').delete().eq('id',row.id).eq('status','trashed').eq('updated_at',row.updated_at).select('id');if(error)throw error;if(!data.length)throw new Error('This letter changed. Refresh before deleting.');message('Entry permanently deleted.');}await load();});};
  $('#new-chapter').onclick=()=>showChapter();$('#cancel-chapter').onclick=()=>$('#chapter-dialog').close();
  $('#chapter-list').onclick=e=>{
    const edit=e.target.closest('[data-edit-chapter]'),del=e.target.closest('[data-delete-chapter]'),order=e.target.closest('[data-order]');
    if(edit)showChapter(chapters.find(c=>c.id===edit.dataset.editChapter));
    if(del){if(chapters.length<=1){message('Keep at least one chapter.',true);return;}chapterDeleting=chapters.find(c=>c.id===del.dataset.deleteChapter);const n=rows.filter(r=>r.chapter_id===chapterDeleting.id).length;$('#delete-chapter-note').textContent=`Delete “${chapterDeleting.title}”? All ${n} entries, including any in Trash, will move to the chapter you choose. The letters are kept.`;$('#move-chapter').innerHTML=chapters.filter(c=>c.id!==chapterDeleting.id).map(c=>`<option value="${esc(c.id)}">${esc(c.title)}</option>`).join('');$('#delete-chapter-dialog').showModal();}
    if(order)guard(async()=>{const i=Number(order.dataset.order),j=i+Number(order.dataset.delta);if(!chapters[j])return;const reordered=[...chapters];[reordered[i],reordered[j]]=[reordered[j],reordered[i]];const result=await db.rpc('reorder_journal_chapters',{chapter_ids:reordered.map(c=>c.id)});if(result.error)throw result.error;await load();message('Chapter order updated.');});
  };
  $('#chapter-form').onsubmit=e=>{e.preventDefault();guard(async()=>{const id=chapterEditing?.id||crypto.randomUUID(),title=$('#chapter-title').value.trim();if(!title)throw new Error('Give the chapter a name.');let image=chapterEditing?.image_path||null;const file=$('#chapter-photo').files[0];if(file)image=await upload(file,`chapters/${id}`);const row={id,title,description:$('#chapter-description').value.trim(),intro:$('#chapter-intro').value.trim(),image_path:image,sort_order:chapterEditing?.sort_order??(Math.max(0,...chapters.map(c=>c.sort_order))+1),sample_image:chapterEditing?.sample_image||'images/hero-ocean.jpg'};const result=chapterEditing?await db.from('journal_chapters').update(row).eq('id',id):await db.from('journal_chapters').insert(row);if(result.error)throw result.error;$('#chapter-dialog').close();await load();message('Chapter saved. It is now available in the journal and entry editor.');});};
  $('#cancel-delete-chapter').onclick=()=>$('#delete-chapter-dialog').close();
  $('#delete-chapter-form').onsubmit=e=>{e.preventDefault();guard(async()=>{if(dirty){message('Save your entry changes before deleting a chapter.',true);$('#delete-chapter-dialog').close();return;}const {error}=await db.rpc('delete_journal_chapter',{chapter_to_delete:chapterDeleting.id,move_entries_to:$('#move-chapter').value});if(error)throw error;$('#delete-chapter-dialog').close();await load();await open(current?rows.find(r=>r.id===current.id):null);message('Chapter deleted; its letters were moved safely.');});};
  $('#back-to-letters').onclick=()=>guard(async()=>{
    if(dirty){let valid=true;try{M.validate(collect(),{draft:true});}catch(_){valid=false;}
      if(valid)await save(false,true);else{if(!confirm('This letter needs a title and story before it can save. Leave without saving these changes?'))return;dirty=false;clearTimeout(autoTimer);}
    }
    switchSection('entries');drawList();message('');
  });
  $('#cover-photo').onchange=()=>{$('#cover-preview').innerHTML=photoPreview($('#cover-photo').value);changed();};
  $('#cover-upload').onchange=e=>{const file=e.target.files[0];if(!file)return;guard(async()=>{try{await addDirectPhoto(file,null,null,true);}finally{e.target.value='';}});};
  async function addDirectPhoto(file,index,slot=null,cover=false){
    if(photos.length>=20)throw new Error('This letter has 20 uploaded photos. Remove an unused photo under Your uploaded photos before adding another.');
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
  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
  async function init(){if(!B.configured){message('Connect your Supabase project before signing in.');return;}try{db=B.connect();db.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')lock();});await authorize();}catch(e){lock();message(e.message,true);}}
  init();
})();
