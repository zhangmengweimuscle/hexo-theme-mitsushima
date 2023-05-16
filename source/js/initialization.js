// 页面初始化js
window.onload=function(){
    clickTreeDirectory();
    parentUlBlock();
    searchTree();
    showArticleIndex();
    $(".search-input").focus();
    //当搜索框输入文本，隐藏菜单出现
    $(".search-input").bind("input propertychange",function(event){
        // $(".menu").css("display","block");
        $(".menu").fadeIn('swing');
    })
    //文章页展开
    $("li.post-item").hover(function(e){
        $(e.currentTarget).find("div.bottom").fadeIn('swing');
    },function(e){
            $(e.currentTarget).find("div.bottom").fadeOut('swing');
    })
}

// 点击目录事件
function clickTreeDirectory() {
    // 判断有 active 的话，就递归循环把它的父目录打开
    var treeActive = $("#tree .active");
    if ( treeActive.length ) {
        showActiveTree(treeActive, true);
    }

    // 点击目录，就触发折叠动画效果
    $(document).on("click", "#tree a[class='directory']", function (e) {
        // 用来清空所有绑定的其他事件
        event.preventDefault();

        var icon = $(this).children(".fa");
        var iconIsOpen = icon.hasClass("fa-folder-open");
        var subTree = $(this).siblings("ul");

        icon.removeClass("fa-folder-open").removeClass("fa-folder");

        if (iconIsOpen) {
            if (typeof subTree != "undefined") {
                subTree.slideUp({ duration: 100 });
            }
            icon.addClass("fa-folder");
        } else {
            if (typeof subTree != "undefined") {
                subTree.slideDown({ duration: 100 });
            }
            icon.addClass("fa-folder-open");
        }
    });
}

// 循环递归展开父节点
function showActiveTree(jqNode, isSiblings) {
    if ( jqNode.attr("id") === "tree"  ) { return; }
    if ( jqNode.is("ul") ) {
        jqNode.css("display", "block");

        // 这个 isSiblings 是给搜索用的
        // true 就显示开同级兄弟节点
        // false 就是给搜索用的，值需要展示它自己就好了，不展示兄弟节点
        if ( isSiblings ) { 
            jqNode.siblings().css("display", "block");
            jqNode.siblings("a").css("display", "inline");
            jqNode.siblings("a").find(".fa-folder").removeClass("fa-folder").addClass("fa-folder-open");
        }
    }
    jqNode.each(function(){ showActiveTree($(this).parent(), isSiblings); });
}
function parentUlBlock(){
    var ul = document.getElementsByTagName('ul');
    for(var i=0;i<ul.length;i++){
        if(ul[i].parentNode.tagName == "DIV") ul[i].style.display = "block";
    }
}
// 搜索框输入事件
function searchTree() {
    // 解决搜索大小写问题
    jQuery.expr[':'].contains = function (a, i, m) {
        return jQuery(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
    };

    $("#search input").on("input", function(e){
        e.preventDefault();

        // 获取 inpiut 输入框的内容
        var inputContent = e.currentTarget.value;

        // 没值就收起父目录，但是得把 active 的父目录都展开
        if ( inputContent.length === 0 ) {
            $(".fa-folder-open").removeClass("fa-folder-open").addClass("fa-folder");
            $("#tree ul").css("display", "none");
            if ( $("#tree .active").length ) {
                showActiveTree($("#tree .active"), true);
            }
            else {
                $("#tree").children().css("display", "block");
            }
        }
        // 有值就搜索，并且展开父目录
        else {
            $(".fa-folder").removeClass("fa-folder").addClass("fa-folder-open");
            $("#tree ul").css("display", "none");
            var searchResult = $("#tree li").find("a:contains('" + inputContent + "')");
            if ( searchResult.length ) { 
                showActiveTree(searchResult.parent(), false) 
            }
        }
    });
}
function showArticleIndex() {
    // 先刷一遍文章有哪些节点，把 h1 h2 h3 加入列表，等下循环进行处理。
    // 如果不够，可以加上 h4 ,只是我个人觉得，前 3 个就够了，出现第 4 层就目录就太长了，太细节了。
    var h1List = h2List = h3List = [];
    var labelList = $("#article").children();
    for ( var i=0; i<labelList.length; i++ ) {
        if ( $(labelList[i]).is("h1") ) {
            h2List = new Array();
            h1List.push({node: $(labelList[i]), id: i, children: h2List});
        }

        if ( $(labelList[i]).is("h2") ) {
            h3List = new Array();
            h2List.push({node: $(labelList[i]), id: i, children: h3List});
        }

        if ( $(labelList[i]).is("h3") ) {
            h3List.push({node: $(labelList[i]), id: i, children: []});
        }
    }
    // 闭包递归，返回树状 html 格式的文章目录索引
    function show(tocList) {
        var content = "<ul class='live'>";
        tocList.forEach(function (toc) {
            toc.node.before('<span class="anchor" id="_label'+toc.id+'"></span>');
            if ( toc.children == 0 ) {
                content += '<li><a style="display:block;" href="#_label'+toc.id+'">'+toc.node.text()+'</a></li>';
            }
            else {
                content += '<li><a style="display:block;" href="#_label'+toc.id+'">'+toc.node.text()+'</a>'+show(toc.children)+'</li>';
            }
        });
        content += "</ul>"
        return content;
    }

// 最后组合成 div 方便 css 设计样式，添加到指定位置
    $("#toc").empty();
    $("#toc").append(show(h1List));

    // 点击目录索引链接，动画跳转过去，不是默认闪现过去
    $("#toc a").on("click", function(e){
        e.preventDefault();
        // 获取当前点击的 a 标签，并前触发滚动动画往对应的位置
        var target = $(this.hash);
        $("body, html").animate(
            {'scrollTop': target.offset().top},
            500
        );
    });
    // 监听浏览器滚动条，当浏览过的标签，给他上色。
    $(window).on("scroll", function(e){
        var anchorList = $(".anchor");
        
        anchorList.each(function(){
            var tocLink = $('#toc a[href="#'+$(this).attr("id")+'"]');
            var anchorTop = $(this).offset().top;
            var windowTop = $(window).scrollTop();
            if ( anchorTop <= windowTop+50 ) {
                tocLink.addClass("read");
            }
            else {
                tocLink.removeClass("read");
                // tocTop+=.1;
                
                // $("#toc").css("top",tocTop);
            }
        }
        );
        var scrollPercent = ($(window).scrollTop()/($(document).height()-$(window).height()))*100;
        scrollPercent = scrollPercent.toFixed(1);
        $("#toc").css("top",(($("#toc").height()-$(window).height())*.01+.55)*(1-scrollPercent));
    });
}