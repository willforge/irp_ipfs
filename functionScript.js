
// assumed api_url is already defined ...

function getInputValue(id) {
  let e = document.getElementById(id);
  if (typeof(e) !=  'undefined') {
    return e.value
  } else {
    console.error('id: '+id+ 'not defined');
  }
}

async function getStatofMfsPath(mfs_path) {
   let url = api_url + 'files/stat?arg='+mfs_path+'&hash=true&type=true'
   return fetchGetPostJson(url)
   .then(obj => {
    console.log('getStatofMfsPath.obj: ',obj);
    return obj;
    })
   .catch(console.error)
}  

async function provide_directory_content() {
  let mfs_path = getInputValue('mfs_pathinputid');
  
  // build directory content ...
  return build_directory_content(mfs_path);

}

function build_directory_content(mfs_path) {
  let  url = api_url + 'files/ls?arg='+mfs_path+'&long=true&U=true'
  return fetchRespCatch(url)
  .then(obj => {
     let table_of_content = obj.Entries;
     console.log('build_directory_content: ',table_of_content);
     return { "dirname":mfs_path,"TOC":table_of_content };


   })
   .catch( obj => { logError('build_directory_content.catch',obj) })
}

async function providePinStatus(item) {
  let dirname = stored[item].DirName;
  let filename = stored[item].Name;
  let hash = stored[item].Hash;
   let mfs_path = dirname+'/'+filename
   let pin_status = await getPinStatus(hash);
   return pin_status;
}

function getPinStatus(hash) { // getdata
   let  url = api_url + 'pin/ls?arg=/ipfs/'+hash+'&type=all'
   return fetchRespNoCatch(url)
   .then( obj => {
       let status;
       if (typeof(obj.Code) == 'undefined') {
         status = obj.Keys[hash].Type
       } else {
         status = 'unpinned'
       }
       console.log('getPinStatus: '+hash+" \u21A6",status);
       return status
   })
   .catch( obj => { logError('getPinStatus.catch',obj) })
}




