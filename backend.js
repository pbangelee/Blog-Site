/* Shared data adapter: working copies are author-only, published snapshots are public. */
window.JournalBackend = (() => {
  const config=window.JOURNAL_CONFIG||{};
  const configured=Boolean(config.supabaseUrl&&config.publishableKey);let client;
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function connect(){
    if(!configured)throw new Error('Connect the Supabase project in js/config.js first.');
    if(!window.supabase)throw new Error('The sign-in service could not load. Check your connection and reload.');
    return client ||= window.supabase.createClient(config.supabaseUrl,config.publishableKey);
  }
  async function signedPhotos(paths){
    const unique=[...new Set(paths.filter(Boolean))];if(!unique.length)return {};
    const {data,error}=await connect().storage.from('journal-photos').createSignedUrls(unique,3600);if(error)throw error;
    const map={};unique.forEach((p,i)=>{if(!data[i]?.signedUrl)throw new Error('A photo could not load. Please refresh and try again.');map[p]=data[i].signedUrl;});return map;
  }
  function entryFromRow(row,signed,journal=window.JOURNAL){
    const photos={},pathToId={};
    (row.photos||[]).forEach((p,i)=>{const id=`${row.id}-photo-${i}`;pathToId[p.path]=id;photos[id]={src:signed[p.path]||'',alt:String(p.alt||row.title),caption:escape(p.caption||''),captionText:String(p.caption||''),sample:p.sample===true};});
    let cover=pathToId[row.cover_path]||`${row.id}-cover`;
    if(!photos[cover])photos[cover]={src:journal.site.heroImage,alt:journal.site.heroAlt,caption:'',sample:true};
    const body=[];
    const blocks=row.blocks?.length?row.blocks:[{type:'text',text:row.content}];
    blocks.forEach(b=>{
      if(b.type==='text')String(b.text||'').split(/\n\s*\n/).filter(Boolean).forEach(text=>body.push({type:'p',text:escape(text).replace(/\n/g,'<br>')}));
      if(b.type==='quote'&&b.text)body.push({type:'quote',text:escape(b.text).replace(/\n/g,'<br>'),attribution:escape(b.attribution||'')});
      if(b.type==='photo'&&pathToId[b.photo])body.push({type:'photo',id:pathToId[b.photo],layout:b.layout==='center'?'center':'full'});
      if(b.type==='pair'){const ids=(b.photos||[]).map(p=>pathToId[p]).filter(Boolean);if(ids.length)body.push({type:'group',ids});}
    });
    return {photos,entry:{id:row.id,chapter:row.chapter_id,title:escape(row.title),titleText:String(row.title),date:row.entry_date,excerpt:escape(row.excerpt),cover,body}};
  }
  async function publishedJournal(){
    const db=connect();
    const [entriesResult,chaptersResult]=await Promise.all([
      db.from('journal_public_entries').select('*').order('entry_date',{ascending:false}),
      db.from('journal_chapters').select('*').order('sort_order').order('id')
    ]);
    if(entriesResult.error||chaptersResult.error)throw entriesResult.error||chaptersResult.error;
    const journal=window.JOURNAL,rows=entriesResult.data,chapters=chaptersResult.data;
    const signed=await signedPhotos([...chapters.map(c=>c.image_path),...rows.flatMap(e=>(e.photos||[]).map(p=>p.path))]);
    journal.chapters=chapters.map(c=>({id:c.id,title:escape(c.title),titleText:c.title,description:escape(c.description),intro:escape(c.intro),order:c.sort_order,image:signed[c.image_path]||c.sample_image||journal.site.heroImage}));
    journal.entries=[];journal.photos={};
    rows.forEach(row=>{const converted=entryFromRow(row,signed,journal);journal.entries.push(converted.entry);Object.assign(journal.photos,converted.photos);});
    journal.map={markers:[]};journal.site.sampleNotice=journal.entries.some(e=>journal.photos[e.cover]?.sample)?'Sample illustrations are included for demonstration.':'';
    return rows.length;
  }
  return {configured,connect,publishedJournal,escape,signedPhotos,entryFromRow};
})();
