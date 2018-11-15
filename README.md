# freelog-onepiece-wwzh 


### 功能介绍
海贼王漫画展示插件; 

### 调用方式
|属性（参数）|必填|描述|
|---|---|---|
|data-widget-src|无|widget的资源ID|

```html
<!--在PB中引用-->
<freelog-onepiece-wwwzh  class="js-wc-widget" data-widget-src="d2686bda89418e51bae5739a5411f245f0e0d78c"></freelog-onepiece-wwwzh>
```

```javascript
// JS中调用
window.FreelogApp.QI.requireSubSource('d2686bda89418e51bae5739a5411f245f0e0d78c')
    .then(res => {
        var elem = document.createElement('freelog-onepiece-wwwzh')
        document.querySelector('body').append(elem)
    })
```


### 依赖资源
|资源名称|资源ID|
|---|---|
|无|无|


### 资源meta
无


### 节点资源配置说明
节点中，插件须搭配如下资源方可使用

#### 资源一：`头图` 
- 描述：页面头部封面图
- 类型：image
- 是否必须：是
- 标签：无

#### 资源二：`剧集 - 导航` 
- 描述：通过给资源打标签的方式，动态控制剧集导航
- 资源类型：json
- 是否必须：是
- 标签：

|名称|是否必须 |描述|
|---|---|---|
|nav-tags|是|用于标记该JSON资源，方便接口查询|
|nav-1-200|是|表示1-200的剧集导航|

- meta: 无

- 资源内容：

```
[{}]
```



### 效果图

![image](https://note.youdao.com/favicon.ico)


