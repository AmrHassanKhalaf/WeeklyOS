(function(){"use strict";let t=null;self.onmessage=e=>{if(e.data==="start"){if(t)return;t=setInterval(()=>{self.postMessage("tick")},1e3);return}e.data==="stop"&&t&&(clearInterval(t),t=null)}})();
