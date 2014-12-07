var Rotation1 = function(){
  $('.slideButton').each(function(){ 
    var $el = $(this),
        $sl = $el.find('.slider'),
        $po = $el.find('.pointer'),
        $pa = $el.find('.panel'),
        rad = $el.width()/2 ,
        elP = $el.offset(),
        elPos = { x:elP.left, y:elP.top },
        s = {d:0,p:0},
        s2 = {d:s.d,p:s.p};

   function d(e){
      var mPos = {x: e.pageX-elPos.x,y: e.pageY-elPos.y};	
      var getAtan = Math.atan2(mPos.x-rad, mPos.y-rad);    
      s.d = -getAtan/(Math.PI/180) + 180;
      s.p =  Math.round(s.d*100/360);
      $pa.text(s.p);
   }

  $el.mousemove(function(e){
    d(e);  
    $el.css({backgroundColor: 'hsla(190, 90%, '+ s.p +'%, 1)'});
    $sl.css({transform:'rotate('+ s.d +'deg)'});
    }).click(function(){
       s2 = {d:s.d, p:s.p};
       $po.css({transform:'rotate('+ s.d +'deg)'});
    }).mouseleave(function(){
       $el.css({backgroundColor: 'hsla(190, 90%, '+ s2.p +'%, 1)'});
       $sl.css({transition:'0.3s',transform:'rotate('+ s2.d +'deg)'});
       setTimeout(function(){
          $sl.css({transition:'0s'}); 
         $pa.text(s2.p);    
       },210);
    });
  
  });
}

var Rotation2 = function(){
  $('.slideButton').each(function(){ 
    var $el = $(this),
        $sl = $el.find('.slider'),
        $po = $el.find('.pointer'),
        $pa = $el.find('.panel'),
        rad = $el.width()/2 ,
        elP = $el.offset(),
        elPos = { x:elP.left, y:elP.top },
        s = {d:0,p:0},
        s2 = {d:s.d,p:s.p};

   function d(e){
      var mPos = {x: e.pageX-elPos.x,y: e.pageY-elPos.y};	
      var getAtan = Math.atan2(mPos.x-rad, mPos.y-rad);    
      s.d = -getAtan/(Math.PI/180) + 180;
      s.p =  Math.round(s.d*100/360);
      $pa.text(s.p);
   }

  $el.mousemove(function(e){
    d(e);  
    $el.css({backgroundColor: 'hsla(190, 90%, '+ s.p +'%, 1)'});
    $sl.css({transform:'rotate('+ s.d +'deg)'});
    }).click(function(){
       s2 = {d:s.d, p:s.p};
       $po.css({transform:'rotate('+ s.d +'deg)'});
    }).mouseleave(function(){
       $el.css({backgroundColor: 'hsla(190, 90%, '+ s2.p +'%, 1)'});
       $sl.css({transition:'0.3s',transform:'rotate('+ s2.d +'deg)'});
       setTimeout(function(){
          $sl.css({transition:'0s'}); 
         $pa.text(s2.p);    
       },210);
    });
  
  });
}
