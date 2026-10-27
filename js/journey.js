/* Shared journey sections and stable theme IDs. Author edits arrive from Supabase. */
window.JournalJourney = (() => {
  const start=window.JOURNAL_CONFIG?.missionStart||'2025-06-23';
  const anniversary=n=>{const d=new Date(start+'T12:00:00Z');d.setUTCFullYear(d.getUTCFullYear()+n);return d.toISOString().slice(0,10);};
  const periods=[{id:'before',title:'Before the Mission',start:'0001-01-01',end:start,description:'The calling, the preparations, and the beginning.',visibility:'auto'},...[0,1,2].map(n=>({id:'year-'+(n+1),title:['Year One','Year Two','Year Three'][n],start:anniversary(n),end:anniversary(n+1),description:['The first year, remembered through its meaningful moments.','Stories and reflections as the journey continues.','The final year and the lessons carried forward.'][n],visibility:'auto'}))];
  const themes=['Faith','People','Leadership','Everyday Moments','What We’re Learning'],names=new Map(themes.map(t=>[t,t]));
  function load(sectionRows,themeRows){
    if(sectionRows)periods.splice(0,periods.length,...sectionRows.map(p=>({id:p.id,title:p.title,description:p.description,start:p.start_date,end:p.end_date,visibility:p.visibility,order:p.sort_order})));
    if(themeRows){colors.clear();themeRows.forEach(t=>colors.set(t.id,validColor(t.color)));themes.splice(0,themes.length,...themeRows.map(t=>t.id));names.clear();themeRows.forEach(t=>names.set(t.id,t.name));}
  }
  const themeName=id=>names.get(id)||id;
  const colors=new Map(),defaultColor='#e6eedf';
  const validColor=value=>/^#[0-9a-f]{6}$/i.test(value||'')?value:defaultColor;
  const themeColor=id=>validColor(colors.get(id));
  function textColor(hex){const rgb=validColor(hex).slice(1).match(/../g).map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);const lum=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];return lum>.179?'#000000':'#ffffff';}
  const themeStyle=id=>`background-color:${themeColor(id)};color:${textColor(themeColor(id))};border-color:${themeColor(id)}`;

  const periodFor=date=>periods.find(p=>p.start&&p.end&&date>=p.start&&date<p.end);
  const forEntry=e=>e.journeyId?periods.find(p=>p.id===e.journeyId):periodFor(e.date);
  const inPeriod=(entry,id)=>!id||forEntry(entry)?.id===id;
  function visiblePeriods(today){
    if(!today){const now=new Date();today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
    const shown=window.JOURNAL_CONFIG?.showFutureJourneyYears||[],hidden=window.JOURNAL_CONFIG?.hiddenJourneyYears||[];
    return periods.filter(p=>!hidden.includes(p.id)&&p.visibility!=='hidden'&&(p.visibility==='shown'||!p.start||p.start<=today||shown.includes(p.id)));
  }
  return {start,periods,themes,themeName,themeColor,themeStyle,textColor,validColor,periodFor,forEntry,inPeriod,visiblePeriods,load};
})();
