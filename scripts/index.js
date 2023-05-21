//解析HTML字符串的内容
const STATE_PLAINTEXT = Symbol('plaintext');
const STATE_HTML = Symbol('html');
const STATE_COMMENT = Symbol('comment');

function striptags(html = '') {
  // if not string, then safely return an empty string
  if (typeof html !== 'string' && !(html instanceof String)) {
    return '';
  }

  let state = STATE_PLAINTEXT;
  let tag_buffer = '';
  let depth = 0;
  let in_quote_char = '';
  let output = '';

  const { length } = html;

  for (let idx = 0; idx < length; idx++) {
    const char = html[idx];

    if (state === STATE_PLAINTEXT) {
      switch (char) {
        case '<':
          state = STATE_HTML;
          tag_buffer = tag_buffer + char;
          break;

        default:
          output += char;
          break;
      }
    } else if (state === STATE_HTML) {
      switch (char) {
        case '<':
          // ignore '<' if inside a quote
          if (in_quote_char) break;

          // we're seeing a nested '<'
          depth++;
          break;

        case '>':
          // ignore '>' if inside a quote
          if (in_quote_char) {
            break;
          }

          // something like this is happening: '<<>>'
          if (depth) {
            depth--;

            break;
          }

          // this is closing the tag in tag_buffer
          in_quote_char = '';
          state = STATE_PLAINTEXT;
          // tag_buffer += '>';

          tag_buffer = '';
          break;

        case '"':
        case '\'':
          // catch both single and double quotes

          if (char === in_quote_char) {
            in_quote_char = '';
          } else {
            in_quote_char = in_quote_char || char;
          }

          tag_buffer = tag_buffer + char;
          break;

        case '-':
          if (tag_buffer === '<!-') {
            state = STATE_COMMENT;
          }

          tag_buffer = tag_buffer + char;
          break;

        case ' ':
        case '\n':
          if (tag_buffer === '<') {
            state = STATE_PLAINTEXT;
            output += '< ';
            tag_buffer = '';

            break;
          }

          tag_buffer = tag_buffer + char;
          break;

        default:
          tag_buffer = tag_buffer + char;
          break;
      }
    } else if (state === STATE_COMMENT) {
      switch (char) {
        case '>':
          if (tag_buffer.slice(-2) === '--') {
            // close the comment
            state = STATE_PLAINTEXT;
          }

          tag_buffer = '';
          break;

        default:
          tag_buffer = tag_buffer + char;
          break;
      }
    }
  }

  return output;
}

var counter = function (content) {
    content = striptags(content);
    const cn = (content.match(/[\u4E00-\u9FA5]/g) || []).length;
    const en = (content.replace(/[\u4E00-\u9FA5]/g, '').match(/[a-zA-Z0-9_\u0392-\u03c9\u0400-\u04FF]+|[\u4E00-\u9FFF\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af\u0400-\u04FF]+|[\u00E4\u00C4\u00E5\u00C5\u00F6\u00D6]+|\w+/g) || []).length;
    return [cn, en];
  };

// 对输入的HTML进行字数统计
var wcount = function(content, kflag = true){
    var len = counter(content);
    var count = len[0] + len[1];
    if (count < 1000 || kflag === false) {
      return count;
    }
    return Math.round(count / 100) / 10 + 'k';
}

//  将全局变量的数据转换成数组
//  输入 siteElement 全局变量,elementKey 要提取的对象名,logflag 是否将所有的1装换成1.15（echarts log模式请打开为true）
hexo.extend.helper.register('site2Arr', function(siteElement,elementKey,logflag = false){
    var output = [];
    siteElement.forEach(element => {
        output.push(element[elementKey])
    });
    if(logflag){
        for(let i = 0;i<output.length;i++){
            if(output[i] == 1){output[i] = 1.15}
        }
    }
    return output
});

// 按分类对文章进行字数统计，比如Java分类下所有文章的字数
hexo.extend.helper.register('sortWcount',function(siteElement){
    var output = [];
    var _m = new Map();
    siteElement.forEach(element =>{
        //初始化map，对每个分类的字数预设为0
        _m.set(element.name,0) 
        element.posts.forEach(post => {
            _m.set(element.name,wcount(post.content,false) + _m.get(element.name))
        })
    });
    output = Array.from(_m.values());
    return output;
});


