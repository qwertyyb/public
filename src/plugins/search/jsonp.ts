/**
 * Callback index.
 */

 var count = 0;

 /**
  * Noop function.
  */
 
 function noop(){}
 
 /**
  * JSONP handler
  *
  * Options:
  *  - param {String} qs parameter (`callback`)
  *  - prefix {String} qs parameter (`__jp`)
  *  - name {String} qs parameter (`prefix` + incr)
  *  - timeout {Number} how long after a timeout error is emitted (`60000`)
  *
  * @param {String} url
  * @param {Object|Function} optional options / callback
  * @param {Function} optional callback
  */
 
 function jsonp(url, opts, fn){
   if ('function' == typeof opts) {
     fn = opts;
     opts = {};
   }
   if (!opts) opts = {};
 
   var prefix = opts.prefix || '__jp';
 
   // use the callback name that was passed if one was provided.
   // otherwise generate a unique name by incrementing our counter.
   var id = opts.name || (prefix + (count++));
 
   var param = opts.param || 'callback';
   var timeout = null != opts.timeout ? opts.timeout : 60000;
   var enc = encodeURIComponent;
   var target = document.getElementsByTagName('script')[0] || document.head;
   var script;
   var timer;
 
 
   if (timeout) {
     timer = setTimeout(function(){
       cleanup();
       if (fn) fn(new Error('Timeout'));
     }, timeout);
   }
 
   function cleanup(){
     if (script.parentNode) script.parentNode.removeChild(script);
   // @ts-ignore
     window[id] = noop;
     if (timer) clearTimeout(timer);
   }
 
   function cancel(){
     if (window[id]) {
       cleanup();
     }
   }

   // @ts-ignore
   window[id] = function(data){
     cleanup();
     if (fn) fn(null, data);
   };
 
   // add qs component
   url += (~url.indexOf('?') ? '&' : '?') + param + '=' + enc(id);
   url = url.replace('?&', '?');
 
   // create script
   script = document.createElement('script');
   script.src = url;
   target.parentNode.insertBefore(script, target);
 
   return cancel;
 }

 export default ({ url, data }) => {
   return new Promise((resolve, rject) => {
     const u = new URL(url)
     Object.keys(data).forEach(key => {
       u.searchParams.append(key, data[key])
     })
     return jsonp(
       u.href,
       {
         param: 'callback'
       },
       resolve
     )
   })
 }