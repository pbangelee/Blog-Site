/* Pure editor helpers, shared by the dashboard and regression checks. */
window.JournalEditorModel = {
  block(type){
    if(type==='text')return {type,text:''};
    if(type==='quote')return {type,text:'',attribution:''};
    if(type==='photo')return {type,photo:'',layout:'full'};
    if(type==='pair')return {type,photos:['','']};
    throw new Error('Unknown block type');
  },
  move(blocks,index,delta){const target=index+delta;if(target<0||target>=blocks.length)return;[blocks[index],blocks[target]]=[blocks[target],blocks[index]];},
  validate(row,{draft=false}={}){
    if(!row.title.trim())throw new Error('Give your letter a title.');
    if(!row.chapter_id)throw new Error('Choose a chapter for this letter.');
    if(!row.entry_date)throw new Error('Choose an entry date.');
    if(!row.blocks.length||row.blocks.length>200)throw new Error('Use between 1 and 200 story sections.');
    if(!draft&&!row.blocks.some(b=>(b.text||'').trim()||b.photo||(b.photos||[]).some(Boolean)))throw new Error('Add some text or a photo to your story.');
    const paths=new Set(row.photos.map(p=>p.path));
    if(row.cover_path&&!paths.has(row.cover_path))throw new Error('Choose an available cover photo.');
    for(const b of draft?[]:row.blocks){
      if(b.type==='photo'&&!paths.has(b.photo))throw new Error('Choose a photo for each photo section.');
      if(b.type==='pair'&&(b.photos.length!==2||b.photos.some(p=>!paths.has(p))))throw new Error('Choose two photos for each photo pair.');
      if(b.type==='pair'&&b.photos[0]===b.photos[1])throw new Error('Choose two different photos for a photo pair.');
    }
    if(row.content.length>100000)throw new Error('This letter is too long. Please keep it under 100,000 characters.');
  },
  usedPaths(row){return [...new Set([row.cover_path,...row.blocks.flatMap(b=>b.type==='photo'?[b.photo]:b.type==='pair'?b.photos:[])].filter(Boolean))];},
  legacyBlocks(row){return row.blocks?.length?structuredClone(row.blocks):[{type:'text',text:row.content||''},...(row.photos||[]).slice(1).map(p=>({type:'photo',photo:p.path,layout:'full'}))];}
};
