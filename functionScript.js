
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
  mfs_path = mfs_path.replace(new RegExp('[^/]+/\.\./'),'')
  
  // build directory content ...
  return build_directory_content(mfs_path);

}

function build_directory_content(mfs_path) {
  let parent_path = mfs_path + '../';
  if (mfs_path == '/') {
  parent_path = '/';
  }
  let promise_parent_hash = getHashofMfsPath(parent_path);
  //console.log('buid_dc.parent_hash: '+parent_hash);
  let url = api_url + 'files/ls?arg='+mfs_path+'&long=true&U=true'
  let promise_dir_content = fetchRespCatch(url)

  return Promise.all([promise_parent_hash,promise_dir_content]) 
  .then(_ => {
     [parent_hash, obj] = _
     console.log('build_directory_content.promise.results: ',_);
     let table_of_content = obj.Entries;
     if (table_of_content == null) {
       table_of_content = [];
     }
     let parent_item = { Name:'..', Type:1, Size:0, Hash:parent_hash, Path:mfs_path }
     console.log('build_directory_content.parent_item: ',parent_item);
     table_of_content.unshift(parent_item)
     console.log('build_directory_content: ',table_of_content);
     return { "dirname":mfs_path, "parent":parent_hash, "TOC":table_of_content };


   })
   .catch( obj => { logError('build_directory_content.catch',obj) })
}
function getHashofMfsPath(mfs_path) {
  let  url = api_url + 'files/stat?arg='+mfs_path+'&hash=true'
  return fetchGetPostJson(url) // get
     .then( json => {
         return json.Hash
     })
}

function provide_file_content() {
  let mfs_path = getInputValue('mfs_pathinputid');
  return getContentofMfsPath(mfs_path);
}


function provideItem(ofwhat) {
  if (typeof(stored[ofwhat]) != 'undefined') {  
    return stored[ofwhat]
  } else {
    throw "Error: "+ofwhat+" not previously stored !";
  }
}
async function providePinStatus(ofwhat) {
  let hash;
  if (ofwhat == 'item') {
     hash = stored[ofwhat].Hash;
     let pin_status = await getPinStatus(hash);
     return pin_status;
  }
/*
  else if (ofwhat == 'curFile') {
    hash = await provideHashofMfsPath('curFile')
  }
  let dirname = stored[item].DirName;
  let filename = stored[item].Name;
  let mfs_path = dirname+'/'+filename

*/
}

async function provideHashofMfsPath(ofwhat) {
  if (typeof(stored[ofwhat].Hash) != 'undefined') {  
    return stored[ofwhat].Hash
  } else {
     let mfs_path = stored[ofwhat].mfs_path
     console.log('provideHashof....stored['+ofwhat+']: ',stored[ofwhat]);
     console.log('provideHashof....mfs_path: ',mfs_path);
     let  url = api_url + 'files/stat?arg='+mfs_path+'&hash=true'
     let hash = await fetchGetPostJson(url) // buid/get
     .then( json => {
         stored[ofwhat].Hash = json.Hash
         return json.Hash
     })
     .catch( console.error )

     return hash;
  }
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
       return Promise.resolve(status)
   })
   .catch( obj => { logError('getPinStatus.catch',obj) })
}

function togglePinStatus(status, hash) {
   let matches = status.match(/through (\w+)/)
   let qmthrough
   if (matches) {
     qmthrough = matches[1]
     console.log('through-qm: '+qmthrough)
     
     status = 'indirect'
   }
   if (status == 'unpinned' || status == 'indirect') {
      return ipfsPinAdd(hash)
      .then( _ => { return getPinStatus(hash)})

   } else if (status == 'direct' || status == 'recursive' || status == 'indirect')  {
      return ipfsPinRm(hash)
      .then( _ => { return getPinStatus(hash)})
   } else {
      console.log('togglePinStatus.status:',status);
      return Promise.resolve('???');
   }
}


function ipfsPinAdd(hash) {
   let url = api_url + 'pin/add?arg=/ipfs/'+hash+'&progress=true'
   return fetchGetPostText(url)
   .then(text => { console.log('ipfsPinAdd.text',text); })
   .catch(err => console.error(err, hash))
}

function ipfsPinRm(hash) {
     let url = api_url + 'pin/rm?arg=/ipfs/'+hash
     console.log('ipfsPinRm.url',url)
     return fetchGetPostJson(url)
	 .then( json => { console.log('ipfsPinRm.json',json);
	     return json.Pins  // Improve when recursive ?
	 })
	 .catch(err => console.error(err, hash))
 } 
 

function getContentofMfsPath(mfsPath) {
   let  url = api_url + 'files/read?arg='+mfsPath
   return fetchRespCatch(url)
}


