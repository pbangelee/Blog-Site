/* Explicit author-only demo import. No records change until a button is clicked. */
(() => {
  const $=s=>document.querySelector(s),B=window.JournalBackend,D=window.JOURNAL_DEMO;
  let db,busy=false,authorized=false;
  function status(text){$('#demo-status').textContent=text;}
  function controls(){['#add-demo','#remove-demo','#demo-text-only'].forEach(s=>$(s).disabled=busy||!authorized);$('#check-login').disabled=busy;}
  function log(text){const li=document.createElement('li');li.textContent=text;$('#demo-log').append(li);li.scrollIntoView({block:'nearest'});}
  function error(result){if(result.error)throw new Error('Publishing the demo entry: '+result.error.message);return result.data;}
  async function check(){
    authorized=false;controls();
    try{
      if(location.protocol==='file:'){status('Open demo-content.html with Live Server, not by double-clicking it. Its address should start with http://127.0.0.1 or http://localhost.');return;}
      db=B.connect();const auth=await db.auth.getUser();
      if(auth.error||!auth.data.user){status('Sign in through the Writing Room first, then return here and choose Check sign-in again.');return;}
      const author=error(await db.from('journal_author').select('user_id').eq('user_id',auth.data.user.id).maybeSingle());
      if(!author){status('Only the designated journal author can add or remove demo content.');return;}
      error(await db.from('journal_public_entries').select('id').limit(1));
      authorized=true;status('Ready. Add demo content will create 24 fictional entries and 5 demo chapters. It will not replace your own entries.');
    }catch(e){status('Could not prepare the demo loader: '+e.message);}finally{controls();}
  }
  async function step(label,operation){
    try{return await operation();}catch(e){throw new Error(label+': '+(e.message||String(e)));}
  }
  async function illustration(entry,index){
    const filename=`demo-${index+1}.jpg`,path=`${entry.id}/${filename}`,bucket=db.storage.from('journal-photos');
    const files=await step('Checking Supabase photo storage',async()=>error(await bucket.list(entry.id,{search:filename})));
    if(!files.some(f=>f.name===filename)){
      const blob=await step('Loading local sample image '+entry.assets[index],async()=>{const response=await fetch(new URL(entry.assets[index],location.href).href);if(!response.ok)throw new Error('HTTP '+response.status+' — check that the images folder is beside demo-content.html.');return response.blob();});
      await step('Uploading sample image to Supabase photo storage',async()=>error(await bucket.upload(path,blob,{contentType:'image/jpeg',upsert:false})));
    }
    return {path,alt:'Illustrated demo landscape; not a real mission photograph.',caption:`Demo illustration ${index+1} — sample artwork, not a real mission photo.`,sample:true};
  }
  async function add(withPhotos=true){
    if(busy||!authorized)return;busy=true;controls();$('#demo-log').innerHTML='';$('#demo-progress').hidden=false;$('#demo-progress').value=0;
    let added=0,skipped=0;
    try{
      // Check chapter IDs before inserting; re-runs never overwrite customized demos.
      const chapterIds=D.chapters.map(c=>c.id);
      const existingChapters=await step('Reading demo chapters from Supabase',async()=>error(await db.from('journal_chapters').select('id').in('id',chapterIds)));
      const present=new Set(existingChapters.map(c=>c.id));
      for(const c of D.chapters)if(!present.has(c.id)){await step('Creating demo chapter '+c.title,async()=>error(await db.from('journal_chapters').insert(c)));log('Chapter added: '+c.title);}
      const existing=await step('Reading existing demo entries from Supabase',async()=>error(await db.from('journal_entries').select('id,status').in('id',D.entries.map(e=>e.id))));
      const known=new Set(existing.map(e=>e.id));
      for(let i=0;i<D.entries.length;i++){
        const entry=D.entries[i];status(`Preparing entry ${i+1} of ${D.entries.length}…\n${entry.title}`);
        if(known.has(entry.id)){skipped++;log('Kept existing: '+entry.title);$('#demo-progress').value=i+1;continue;}
        const photos=[];for(let n=0;withPhotos&&n<entry.assets.length;n++)photos.push(await illustration(entry,n));
        const blocks=[{type:'text',text:'FICTIONAL DEMO ENTRY — created only to explore the website and Writing Room.\n\n'+entry.paragraphs[0]}];
        if(photos.length&&entry.layout==='pair')blocks.push({type:'pair',photos:photos.map(p=>p.path)});
        else if(photos.length)blocks.push({type:'photo',photo:photos[1].path,layout:entry.layout});
        blocks.push({type:'text',text:entry.paragraphs[1]},{type:'quote',text:entry.quote,attribution:'Fictional demo reflection'},{type:'text',text:'This is sample content. You can edit this entry to explore the builder, or remove all demo entries from the demo loader later.'});
        let row={id:entry.id,title:entry.title,chapter_id:entry.chapter_id,entry_date:entry.entry_date,excerpt:entry.excerpt,content:blocks.filter(b=>b.text).map(b=>b.text).join('\n\n'),photos,blocks,cover_path:photos[0]?.path||null,status:'draft'};
        row=await step('Saving demo entry to Supabase',async()=>error(await db.from('journal_entries').insert(row).select().single()));
        if(entry.published){
          const result=await db.rpc('publish_journal_entry',{entry_id:row.id,expected_updated_at:row.updated_at});
          if(result.error){
            // Roll back only this newly-created draft so Retry can finish it cleanly.
            const cleanup=await db.from('journal_entries').delete().eq('id',row.id).eq('status','draft');
            if(cleanup.error)throw new Error('Publishing failed and the demo entry remains as a draft: '+result.error.message);
            throw new Error('Publishing the demo entry: '+result.error.message);
          }
        }
        added++;log((entry.published?'Published: ':'Draft saved: ')+entry.title);$('#demo-progress').value=i+1;
      }
      status(`Done! Added ${added} entries; kept ${skipped} existing demo entries.\nThe complete batch has 18 published entries and 6 drafts. Refresh the journal and Writing Room to see them.`);
    }catch(e){status(`Import paused after ${added} new entries. Your own entries have not been changed.\n${e.message}\nYou can retry safely. If the failure concerns images or photo storage, choose Add entries without photos to fill the site while we troubleshoot pictures.`);}finally{busy=false;controls();}
  }
  async function remove(){
    if(busy||!authorized)return;
    if(!confirm('Permanently remove the 24 known demo entries, including edits you made to them? Your other entries are kept. Demo chapters with your own entries will stay.'))return;
    busy=true;controls();$('#demo-log').innerHTML='';
    try{
      status('Removing demo entries…');
      const deleted=error(await db.from('journal_entries').delete().in('id',D.entries.map(e=>e.id)).select('id'));
      let kept=0;
      for(const c of D.chapters){
        const [working,live]=await Promise.all([db.from('journal_entries').select('id').eq('chapter_id',c.id).limit(1),db.from('journal_public_entries').select('id').eq('chapter_id',c.id).limit(1)]);
        if(error(working).length||error(live).length){kept++;log('Kept chapter because it contains another entry: '+c.title);continue;}
        const remaining=error(await db.from('journal_chapters').select('id'));
        if(remaining.length<=1&&remaining.some(ch=>ch.id===c.id)){kept++;log('Kept the final chapter so the journal still has a chapter.');continue;}
        error(await db.from('journal_chapters').delete().eq('id',c.id));
      }
      $('#demo-progress').hidden=true;status(`Removed ${deleted.length} demo entries. ${kept} demo chapters were kept because they are still needed.\nRefresh the journal and Writing Room. Uploaded illustration files remain private in storage.`);
    }catch(e){status('Cleanup could not finish: '+e.message+' You can retry; only known demo IDs are targeted.');}finally{busy=false;controls();}
  }
  $('#add-demo').onclick=()=>add(true);$('#demo-text-only').onclick=()=>add(false);$('#remove-demo').onclick=remove;$('#check-login').onclick=check;
  window.addEventListener('beforeunload',e=>{if(busy){e.preventDefault();e.returnValue='';}});
  check();
})();
