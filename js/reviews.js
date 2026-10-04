/* Customer reviews: renders WhatsApp screenshots + lightbox. Vanilla JS, no dependencies.
   To add a review, drop a file in assets/reviews/ and add its filename below. */
(function(){
  var FILES=["review-01.webp","review-02.webp","review-03.webp","review-04.webp","review-05.webp","review-06.webp"];
  var DIR="assets/reviews/";
  var ALT="Customer feedback via WhatsApp";
  var root=document.getElementById("reviews"); if(!root) return;
  var grid=root.querySelector(".reviews-grid"), cta=root.querySelector("[data-reviews-all]");
  var loaded=[], pending=FILES.length, idx=0, lb, lbImg, lbCount, lastFocus;

  FILES.forEach(function(f,i){
    var img=new Image(); img.src=DIR+f;
    img.onload=function(){loaded[i]={src:DIR+f,w:img.naturalWidth,h:img.naturalHeight}; done();};
    img.onerror=function(){done();}; // missing file = silently skipped, no broken images
  });

  function done(){ if(--pending) return; loaded=loaded.filter(Boolean); if(!loaded.length) return; render(); }

  function render(){
    grid.innerHTML=loaded.map(function(r,i){
      return '<button type="button" class="review-card" data-i="'+i+'" aria-label="Open customer review '+(i+1)+' of '+loaded.length+'">'+
        '<img src="'+r.src+'" width="'+r.w+'" height="'+r.h+'" alt="'+ALT+'" '+(i<3?'':'loading="lazy" ')+'decoding="async">'+
        '<span>Customer Feedback</span></button>';
    }).join("");
    root.hidden=false;
    grid.addEventListener("click",function(e){var b=e.target.closest(".review-card"); if(b) open(+b.dataset.i);});
    if(cta) cta.addEventListener("click",function(){open(0);});
  }

  function build(){
    lb=document.createElement("div"); lb.className="zoom-overlay"; lb.hidden=true;
    lb.setAttribute("role","dialog"); lb.setAttribute("aria-modal","true"); lb.setAttribute("aria-label","Customer reviews");
    lb.innerHTML='<button class="zoom-close" aria-label="Close">&times;</button>'+
      '<button class="zoom-nav zoom-prev" aria-label="Previous review">&#8249;</button>'+
      '<img class="zoom-image" alt="'+ALT+'"><button class="zoom-nav zoom-next" aria-label="Next review">&#8250;</button>'+
      '<div class="zoom-hint" aria-live="polite"></div>';
    document.body.appendChild(lb);
    lbImg=lb.querySelector(".zoom-image"); lbCount=lb.querySelector(".zoom-hint");
    lb.addEventListener("click",function(e){
      if(e.target===lb||e.target.classList.contains("zoom-close")) close();
      else if(e.target.classList.contains("zoom-prev")) step(-1);
      else if(e.target.classList.contains("zoom-next")) step(1);
    });
    var x0=null;
    lb.addEventListener("touchstart",function(e){x0=e.touches[0].clientX;},{passive:true});
    lb.addEventListener("touchend",function(e){ if(x0===null) return; var d=e.changedTouches[0].clientX-x0; if(Math.abs(d)>50) step(d<0?1:-1); x0=null;});
    document.addEventListener("keydown",function(e){
      if(lb.hidden) return;
      if(e.key==="Escape") close(); else if(e.key==="ArrowLeft") step(-1); else if(e.key==="ArrowRight") step(1);
      else if(e.key==="Tab"){ var f=lb.querySelectorAll("button"), a=document.activeElement;
        if(e.shiftKey&&a===f[0]){e.preventDefault();f[f.length-1].focus();}
        else if(!e.shiftKey&&a===f[f.length-1]){e.preventDefault();f[0].focus();} }
    });
  }

  function show(){
    lbImg.src=loaded[idx].src; lbCount.textContent=(idx+1)+" / "+loaded.length;
    var multi=loaded.length>1; lb.querySelector(".zoom-prev").hidden=!multi; lb.querySelector(".zoom-next").hidden=!multi;
  }
  function step(d){ idx=(idx+d+loaded.length)%loaded.length; show(); }
  function open(i){ if(!lb) build(); lastFocus=document.activeElement; idx=i; show(); lb.hidden=false;
    document.body.classList.add("rv-open"); lb.querySelector(".zoom-close").focus(); }
  function close(){ lb.hidden=true; document.body.classList.remove("rv-open"); if(lastFocus) lastFocus.focus(); }
})();
