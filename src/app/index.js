import style from './index.css'

var html = require('./index.html')

class FreelogOnepieceWwzh extends HTMLElement {
  constructor() {
    super()


    let self = this;
    let shadowRoot = self.attachShadow({mode: 'open'});
    
    this.root = shadowRoot
    this.root.innerHTML = html

  }

  connectedCallback(){
    style.use()
    this.init()
    this.bindEvent()
  }

  disconnectCallback (){
    clearTimeout(this.timer)
    this.timer = null
  }

  attributeChangeCallback(attrName, oldVal, newVal){

  }

  init (){
    this.renderListData = []
    this.activeComicsIamgeList = []
    this.presentableResourceMap = []
    this.activeComicsIndex = 1
    this.comicsImagePresentableList = []
    this.initDom()
    this.fetchNavTagsList()
  }

  initDom (){
    var $root = this.root 
    this.$errorToast = $root.querySelector('#comics-error-toast'),
    this.$errorInfo = this.$errorToast.querySelector('#comics-et-info'),
    this.$errorBtn = this.$errorToast.querySelector('#comics-et-btn'),
    this.$errorDuration = this.$errorToast.querySelector('#comics-et-duration')
    this.$errorCloseBtn = this.$errorToast.querySelector('.comics-close-btn')
    this.$comicsBox = $root.querySelector('.comics-display-box')
    this.$contentBox = this.$comicsBox.querySelector('#comics-content')
    this.$comicsHeader = $root.querySelector('.comics-db-header')
    this.$list = $root.querySelector('.comics-list')
    this.$prevBtn = $root.querySelector('#comics-prev-btn')
    this.$nextBtn = $root.querySelector('#comics-next-btn')
    this.$nav = $root.querySelector('.comics-nav')
    this.$backTopBtn = this.$comicsBox.querySelector('.comics-backtotop')
  }

  // 获取类型为“json”的漫画资源列表
  fetchNodeResourcesList (tags){
    
    this.showLoading()
    return window.FreelogApp.QI.fetch(`/v1/presentables?nodeId=${window.__auth_info__.__auth_node_id__}&resourceType=json&isOnline=1&tags=${tags}`)
      .then(resp => resp.json())
      .then(res => {
        console.log('res --', res, res.errcode == 0)
        this.hideLoading()
        if(res.errcode == 0){
          this.renderListData = res.data
          this.renderListData.length && this.renderComicsList()
          return Promise.resolve()
        }else{
          window.FreeLogApp.handleErrorResponse(res)
          return Promise.reject(res)
        }
      })
      .catch(e => {
        this.hideLoading()
        console.log(typeof e, e)
        if(typeof e == 'string'){
          console.error('e --', e)
        }else{
          console.log(`/v1/presentables 请求失败：${e.msg}`)
        }
        
      })
  }

  fetchNavTagsList (){
    window.FreelogApp.QI.fetch(`/v1/presentables?nodeId=${window.__auth_info__.__auth_node_id__}&resourceType=json&isOnline=1&tags=nav-tags`)
      .then(resp => resp.json())
      .then(res => {
        
        if(res.errcode == 0){
          if(res.data.length) {
            const { meta: { nav_tags } } = (res.data)[0].resourceInfo
            const userDefinedTags = nav_tags.filter(tag => {
              return /^nav-\d+-\d+$/.test(tag)
            })

            this.fetchNodeResourcesList(userDefinedTags[this.activeComicsIndex])
            this.renderComicsNav(userDefinedTags)
            this.userDefinedTags = userDefinedTags
          }

        }else{
          window.FreeLogApp.handleErrorResponse(res)
          return Promise.reject(res)
        }
      })
      .catch(e => {
        console.log(typeof e, e)
        if(typeof e == 'string'){
          console.error('e --', e)
        }else{
          console.log(`/v1/presentables 请求失败：${e.msg}`)
        }
        
      })
  }

  fetchNodeResourceDetail (presentableId, resourceId){
    return window.FreelogApp.QI.fetch(`/v1/auths/presentable/${presentableId}.data?nodeId=${window.__auth_info__.__auth_node_id__}&resourceId=${resourceId}`)
            .then(resp => resp.json())
  }

  // 获取漫画图片资源
  fethchCommicsImagesResourcesList (targs){
    return window.FreelogApp.QI.fetch(`/v1/presentables?nodeId=${window.__auth_info__.__auth_node_id__}&resourceType=image&tags=${targs}&isOnline=1`)
      .then(resp => resp.json())
  }
  
  renderComicsNav (userDefinedTags){
    var str = userDefinedTags.map((tag, index) => {
      tag = tag.replace('nav-', '')
      let activeClass = index == this.activeComicsIndex ? 'active' : ''
      return `
        <a class="comics-nav-item ${activeClass}" href="javascript:;" data-index="${index}" data-tag="${tag}">${tag}</a>
      `
    }).join(' ')
    this.$nav.innerHTML = str
  }

  renderComicsList (){
    console.log(this.renderListData)
    this.renderListData = this.renderListData.filter(item => item.status == 3 || item.status == 7).sort((l1, l2) => {
      const number1 = l1.resourceInfo.meta.number || 0
      const number2 = l2.resourceInfo.meta.number || 0
      return number1 > number2
    })
    let listContentStr = this.renderListData.map((item, index) => {
      const { resourceInfo: { meta: { number = 'N' } } } = item

      return `
        <li class="list-item" title="${item.presentableName}" data-index="${index}">
          <span class="number">${number}话</span>
          <span class="name">${item.presentableName}</span>
        </li>
      `
    }).join(' ')
    this.$list.innerHTML = listContentStr
  }

  showComics (index){
    this.lastActiveComicsIndex = this.activeComicsIndex
    this.activeComicsIndex = +index
    const comics = this.renderListData[index]

    console.log('comics ---', comics)

    if(comics){
      this.showLoading()
      const { userDefinedTags, presentableId, resourceId } = comics
      const { resourceInfo: { meta: { orders, number } } } = comics

      this.fethchCommicsImagesResourcesList(`comics${number}`)
        .then(res => {
          if(res && res.errcode == 0 && res.data.length){
            this.comicsImagePresentableList = res.data
            this.presentableResourceMap = new Map()
            res.data.forEach(item => {
              this.presentableResourceMap.set(item.resourceId, item)
              this.activeComicsIamgeList = orders
              this.$comicsBox.scrollTo(0, 0)
              this.$comicsHeader.innerHTML = comics.presentableName
              this.renderComicsImage()
            })
          }
        })
        .catch(e => {
          console.error(e)
          this.hideLoading()
        })
    } 
  }

  renderComicsImage (){
    const fragment = document.createDocumentFragment()

    this.activeComicsIamgeList = this.activeComicsIamgeList.filter(id => {
      return this.presentableResourceMap.get(id)
    })
    if(this.activeComicsIamgeList.length !== 0) {
      this.activeComicsIamgeList.forEach((id, index) => {
        const ci = this.presentableResourceMap.get(id)

        const { presentableId, presentableName, resourceId, nodeId, isOnline } = ci
        const $img = document.createElement('img')
        const $div = document.createElement('div')
        const $span = document.createElement('span')

        $div.setAttribute('data-index', index)
        $div.setAttribute('data-presentableId', presentableId)
        $div.setAttribute('data-presentablename', presentableName)
        $div.onclick = this.comicsImageOnclick.bind(this)

        $img.src=`api/v1/auths/presentable/${presentableId}.data?nodeId=${nodeId}&resourceId=${resourceId}`
        $img.className = 'comics-image'
        $img.onerror = this.comicsImageOnerror

        $div.appendChild($img)
        $div.appendChild($span)
        fragment.appendChild($div)
      })

      let navItemsCount = this.$nav.querySelectorAll('.comics-nav-item').length
      let actNavItemIndex = +this.$nav.querySelector('.active').getAttribute('data-index')

      if(this.activeComicsIndex == (this.renderListData.length - 1) && (navItemsCount - 1) == actNavItemIndex){
        this.toggleClass(this.$prevBtn, 'hidden', 'delete')
        this.toggleClass(this.$nextBtn, 'hidden', 'add')
      }else if(this.activeComicsIndex == 0 && actNavItemIndex == 0){
        this.toggleClass(this.$prevBtn, 'hidden', 'add')
        this.toggleClass(this.$nextBtn, 'hidden', 'delete')
      }else{
        this.toggleClass(this.$prevBtn, 'hidden', 'delete')
        this.toggleClass(this.$nextBtn, 'hidden', 'delete')
      }

      this.$contentBox.innerHTML = ''
      this.$contentBox.appendChild(fragment)

      this.showModal()
    }else {
      alert('漫画配置出错了！')
      return
    }

  }

  bindEvent (){
    const $root = this.root
    this.$list.addEventListener('click', (e) => {
      let $li = e.target.parentNode == this.$list ? e.target : e.target.parentNode
      let index = $li.getAttribute('data-index')
      this.showComics(index)
    })

    let self = this
    this.$comicsBox.addEventListener('click', function (e) {
      if(e.target == e.currentTarget){
        self.hideModal()
      }
    })

    this.$errorBtn.addEventListener('click', (e) => {
      this.shutdownCountdown = true
      this.toggleClass(this.$errorToast, 'showed', 'delete')
      clearTimeout(this.timer)
      this.timer = null
      // this.presentableErrorResp && this.triggerAppEvent(this.presentableErrorResp)
    })

    this.$prevBtn.addEventListener('click', (e) => {
      const targComicsIndex = this.activeComicsIndex - 1
      if(targComicsIndex == -1){
        let actNavItem = this.$nav.querySelector('.active')
        let navItemIndex = +actNavItem.getAttribute('data-index')
        this.toggleClass(actNavItem, 'active', 'delete')

        let targNavItem = this.$nav.querySelector(`[data-index="${navItemIndex-1}"]`)
        let tag = targNavItem.getAttribute('data-tag')
        this.toggleClass(targNavItem, 'active', 'add')
        this.fetchNodeResourcesList('nav-' + tag)
          .then(() => {
            this.activeComicsIndex = this.renderComicsList.length - 1
            this.showComics(0)
          })
      }else{
        this.showComics(this.activeComicsIndex - 1)
      }
      
    })

    this.$nextBtn.addEventListener('click', (e) => {
      const targComicsIndex = this.activeComicsIndex + 1
      if(this.renderListData.length == targComicsIndex){
        let actNavItem = this.$nav.querySelector('.active')
        let navItemIndex = +actNavItem.getAttribute('data-index')
        this.toggleClass(actNavItem, 'active', 'delete')

        let targNavItem = this.$nav.querySelector(`[data-index="${navItemIndex+1}"]`)
        let tag = targNavItem.getAttribute('data-tag')
        this.toggleClass(targNavItem, 'active', 'add')
        this.fetchNodeResourcesList('nav-' + tag)
          .then(() => {
            this.activeComicsIndex = 0
            this.showComics(0)
          })
      }else{
        this.showComics(this.activeComicsIndex + 1)
      }
      
    })

    this.$nav.addEventListener('click', (e) => {
      if(this.$nav !== e.target){
        this.toggleClass(this.$nav.querySelector('.active'), 'active', 'delete')
        this.toggleClass(e.target, 'active', 'add')
        let tag = e.target.getAttribute('data-tag')
        tag = 'nav-' + tag
        this.fetchNodeResourcesList(tag)
      }
    })

    this.$comicsBox.querySelector('.comics-backtotop').addEventListener('click',(e) => {
      this.$comicsBox.scrollTo(0, 0)
    })

    this.$comicsBox.addEventListener('scroll', this.createThrottleFn(e => {
      const scrollTop = this.$comicsBox.scrollTop
      if(scrollTop > 2400){
        this.toggleClass(this.$backTopBtn, 'showed', 'add')
      }else{
        this.toggleClass(this.$backTopBtn, 'showed', 'delete')
      }
    }, 10, this))

    this.$errorCloseBtn.addEventListener('click', this.closeErrorToast.bind(this))
  }

  toggleClass ($dom, name, type){
    let className = $dom.className.replace(/\s+/, ' ').split(' ')
    let set = new Set(className)
    type == 'add' ? set.add(name) : set.delete(name)
    $dom.className = [...set].join(' ')
  }
  
  showLoading (){
    const $loading = this.root.querySelector('.comics-loading-box')
    this.toggleClass($loading, 'showed', 'add')
  }

  hideLoading(){
    const $loading = this.root.querySelector('.comics-loading-box')
    this.toggleClass($loading, 'showed', 'delete')
  }

  showModal (){
    const $comicsBox = this.root.querySelector('.comics-display-box')
    this.toggleClass($comicsBox, 'showed', 'add')
    
    const bodyStyle = document.querySelector('body').style
    bodyStyle.height = `${window.innerHeight}px`
    bodyStyle.overflow = 'hidden'
  }

  hideModal (){
    const $comicsBox = this.root.querySelector('.comics-display-box')
    this.toggleClass($comicsBox, 'showed', 'delete')

    const bodyStyle = document.querySelector('body').style
    bodyStyle.height = ''
    bodyStyle.overflow = ''
  }

  showErrorToast ( info, btnText, second, callback){

    if(info && btnText){
      this.$errorInfo.innerHTML = info
      this.$errorBtn.innerHTML = btnText
      this.toggleClass(this.$errorToast, 'showed', 'add')

      if(second){
        this.shutdownCountdown = false
        this.closeToastSoon(second, callback)  
      }
    }

  }

  closeErrorToast (){
    this.toggleClass(this.$errorToast, 'showed', 'delete')
    clearTimeout(this.timer)
    this.timer = null
  }

  closeToastSoon (second, callback){
    if(this.shutdownCountdown) return 
    this.$errorDuration.innerHTML = `该提示在${second}秒后自动关闭...`
    if(second == 0) {
      this.toggleClass(this.$errorToast, 'showed', 'delete')
      callback()
      clearTimeout(this.timer)
      this.timer = null
      return 
    }
    second -= 1
    this.timer = setTimeout(() => {
      this.closeToastSoon.call(this, second, callback)
    }, 1000);
  }

  comicsImageOnerror (args1){
    this.className = this.className + ' hidden'
    var $pNode = this.parentNode
    var presentableName = $pNode.getAttribute('data-presentablename')

    $pNode.querySelector('span').innerHTML = `图片(${presentableName})加载失败，授权未通过，前去完成 >>>`
  }

  comicsImageOnclick (e){
    var self = this
    var $dom = e.target
    var presentableId = $dom.parentNode.getAttribute('data-presentableid')

    var index = $dom.getAttribute('data-index')
    window.FreelogApp.trigger('SHOW_SIGN_DIALOG', {
      presentableList: this.comicsImagePresentableList,
      activePresentableId: presentableId
    }, function (data) {
      console.log('data ---', data)
      if(data !== null) {
        data['5be1477ce114f3002971dd0a'].authCode = 0
        for(let presentableId in data) {
          if(!data[presentableId].authCode){
            let $img = self.root.querySelector(`[data-presentableid="${presentableId}"] .hidden`)
            console.log(`[data-presentableid="${presentableId}"] .hidden`, $img)
            $img.src = $img.src + '&t=' + Math.random()
            $img.className =$img.className.replace(/\s+hidden/, '')
          }
        }
      }
    })
  }

  createThrottleFn (fn, interval, context){
    return function (...args){
      clearTimeout(fn.id)
      fn.id = setTimeout(() =>{
        fn.apply(context, args)
      }, interval)
    }
  }
}

customElements.define('freelog-onepiece-wwzh', FreelogOnepieceWwzh);








