var quene = []
React.render = (root, container) => {
  quene.push(root)
  updateFiberAndView()
}
function updateFiberAndView(deadline) {
  updateView() //更新视图，这会耗时，因此需要check时间
  if (deadline.timeRemaining() > 1) {
    var vdom = getVdomFormQueue()
    var fiber = vdom, firstFiber
    var hasVisited = {}
    // 深度优先遍历
    do {
      var fiber = toFiber(fiber); // A
      if(!firstFiber){
        fibstFiber = fiber
      }
      if (!hasVisited[fiber.uuid]) {
        hasVisited[fiber.uuid] = 1
        // 根据fiber.type实例化组件或者创建真实DOM
        updateComponentOrElement(fiber);
        if (fiber.child) {
          // 向下转换
          if (new Date - 0 > deadline) {
              queue.push(fiber.child) // 时间不够，放入栈
              break
          }
          fiber = fiber.child; //让逻辑跑回A处，不断转换child, child.child, child.child.child
          continue 
        }
      }
      //如果组件没有children，那么就向右找
      if (fiber.sibling) {
        fiber = fiber.sibling;
        continue //让逻辑跑回A处
      }
      // 向上找
      fiber = fiber.return
      if(fiber === firstFiber || !fiber){
        break
      }
    } while(1)
  }
  if (queue.length) {
    window.requetIdleCallback(updateFiberAndView, {
      timeout: new Date - 0 + 100
    })
  }
}
function updateComponentOrElement(fiber) {
  var {type, stateNode, props} = fiber
  if(!stateNode){
    if(typeof type === "string"){
        fiber.stateNode = document.createElement(type)
    }else{
        var context = {}//暂时免去这个获取细节
        fiber.stateNode = new type(props, context)
    }
  
    if(stateNode.render){
      //执行componentWillMount等钩子
      children = stateNode.render()
    }else{
      children = fiber.childen
    }
    var prev = null;
    for(var i = 0, n = children.length; i < n; i++){
      var child = children[i];
      child.return = fiber;
      if(!prev){
          fiber.child = child
      }else{
          prev.sibling = child
      }
      prev = child;
    }
  }
}
function getVdomFormQueue() {
  return queue.shift()
}
function Fiber(vnode) {
  for(var i in vnode){
    this[i] = vnode[i]
  }
  this.uuid = Math.random()
}
function toFiber(vnode){
  if(!vnode.uuid){
     return new Fiber(vnode)
  }
  return vnode
}