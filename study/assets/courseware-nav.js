/* ==========================================================================
   交互式课件通用导航脚本 (courseware-nav.js)
   自动向当前课件页面注入统一的浮动顶栏
   - 需在页面 </body> 前引入
   - 依赖 assets/manifest.js（通过 <script> 标签动态加载，兼容 file:// 协议）
   ========================================================================== */
(function () {
  'use strict';

  // 工具：拼接相对于当前 HTML 所在 assets/ 目录的路径
  // 注意：本脚本与 manifest.json 均位于 assets/ 下；
  // 而被注入的 HTML 文件位于各个章节子目录中，因此 manifest 路径需回到 assets/。
  var SCRIPT_TAG = (function () {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i];
      if (s.src && s.src.indexOf('courseware-nav.js') !== -1) return s;
    }
    return null;
  })();

  // 计算 assets 目录的绝对 URL（带末尾斜杠）
  var ASSETS_URL = (function () {
    if (SCRIPT_TAG && SCRIPT_TAG.src) {
      return SCRIPT_TAG.src.replace(/courseware-nav\.js.*$/, '');
    }
    // 兜底：尝试常见相对路径
    return null;
  })();

  // 计算"课件根目录"（assets 的上一级）的 URL
  var ROOT_URL = ASSETS_URL ? ASSETS_URL.replace(/assets\/$/, '') : null;

  // 计算当前 HTML 文件相对于课件根目录的路径
  function currentRelPath() {
    try {
      var here = decodeURIComponent(window.location.pathname).replace(/\\/g, '/').replace(/^\//, '');
      if (!ROOT_URL) return '';
      // ROOT_URL 是字符串，直接取其 pathname 部分
      var rootStr = ROOT_URL;
      try { rootStr = new URL(ROOT_URL).pathname; } catch (e) { /* file:// 等，保持原字符串 */ }
      rootStr = decodeURIComponent(rootStr).replace(/\\/g, '').replace(/^\//, '');
      if (here.indexOf(rootStr) === 0) {
        return here.substring(rootStr.length).replace(/^\//, '');
      }
    } catch (e) { /* 忽略，走兜底 */ }
    // 兜底：取最后几段（章/课/文件）
    var parts = decodeURIComponent(window.location.pathname).replace(/\\/g, '/').split('/');
    return parts.slice(Math.max(0, parts.length - 4)).join('/');
  }

  var currentPath = currentRelPath();

  // 页面元数据（来自 <title> / 兜底）
  var pageTitle = (document.title || '').replace(/\s*\|.*/, '').trim();
  var pageIdMatch = pageTitle.match(/P\d{2,3}/i);
  var pageId = pageIdMatch ? pageIdMatch[0].toUpperCase() : '';

  var MANIFEST = null;
  var FLAT = [];      // 所有页面扁平列表
  var CURR_IDX = -1;  // 当前页在扁平列表中的索引

  function loadManifest(cb) {
    // 优先使用已注入的全局变量（index.html 已用 <script> 引入）
    if (window.CW_MANIFEST) { MANIFEST = window.CW_MANIFEST; cb(); return; }
    if (!ASSETS_URL) { cb(); return; }
    // 课件子页面：动态注入 <script> 标签加载 manifest.js
    // （<script> 标签在 file:// 协议下可正常加载，而 XHR/fetch 不行）
    var s = document.createElement('script');
    s.src = ASSETS_URL + 'manifest.js';
    s.onload = function () {
      MANIFEST = window.CW_MANIFEST || null;
      cb();
    };
    s.onerror = function () { cb(); };
    document.head.appendChild(s);
  }

  function buildFlat() {
    if (!MANIFEST || !MANIFEST.chapters) return;
    FLAT = [];
    MANIFEST.chapters.forEach(function (ch) {
      (ch.pages || []).forEach(function (p) {
        FLAT.push({
          id: p.id,
          title: p.title,
          knowledge: p.knowledge,
          path: p.path,
          chapter: ch.title,
          color: ch.color
        });
      });
    });
    // 定位当前页（优先精确路径匹配）
    CURR_IDX = -1;
    for (var i = 0; i < FLAT.length; i++) {
      if (FLAT[i].path === currentPath ||
          decodeURIComponent(FLAT[i].path) === decodeURIComponent(currentPath) ||
          currentPath.indexOf(FLAT[i].path.split('/').pop()) !== -1) {
        CURR_IDX = i; break;
      }
    }
    // 兜底：用页面标题中的 P 编号匹配
    if (CURR_IDX === -1 && pageId) {
      for (var j = 0; j < FLAT.length; j++) {
        if (FLAT[j].id.toUpperCase() === pageId) { CURR_IDX = j; break; }
      }
    }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function buildTopbar() {
    var homeHref = ROOT_URL ? (ROOT_URL + 'index.html') : '../../index.html';
    var prevBtn = '', nextBtn = '', crumb = '';

    if (CURR_IDX === -1) {
      crumb = '<span class="cw-chip"><strong>课件</strong> ' + esc(pageTitle || '当前页') + '</span>';
    } else {
      var cur = FLAT[CURR_IDX];
      crumb =
        '<span class="cw-chip">' + esc(cur.chapter) + '</span>' +
        '<span class="cw-chip"><strong>' + esc(cur.id) + '</strong> ' + esc(cur.title) + '</span>';

      if (CURR_IDX > 0) {
        var pv = FLAT[CURR_IDX - 1];
        prevBtn =
          '<a class="cw-btn" href="' + esc(ROOT_URL + pv.path) + '" title="' + esc(pv.id + ' ' + pv.title) + '">' +
          '<span class="cw-btn-text">‹ ' + esc(pv.id) + '</span></a>';
      } else {
        prevBtn = '<button class="cw-btn" disabled><span class="cw-btn-text">‹ 已是第一页</span></button>';
      }

      if (CURR_IDX < FLAT.length - 1) {
        var nx = FLAT[CURR_IDX + 1];
        nextBtn =
          '<a class="cw-btn cw-btn-solid" href="' + esc(ROOT_URL + nx.path) + '" title="' + esc(nx.id + ' ' + nx.title) + '">' +
          '<span class="cw-btn-text">' + esc(nx.id) + ' ›</span></a>';
      } else {
        nextBtn = '<button class="cw-btn" disabled><span class="cw-btn-text">已是最后一页</span></button>';
      }
    }

    var idxInfo = (CURR_IDX >= 0)
      ? (CURR_IDX + 1) + ' / ' + FLAT.length
      : '';

    var html =
      '<div id="cw-topbar">' +
        '<div class="cw-brand" title="返回主页">' +
          '<span class="cw-logo" id="cwLogo">⌂</span>' +
          '<div>' +
            '<div class="cw-brand-text">交互式教学手册</div>' +
            '<div class="cw-sub">' + (idxInfo ? '第 ' + idxInfo + ' 个课件' : '网页设计与制作') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="cw-breadcrumb">' + crumb + '</div>' +
        '<div class="cw-nav-group">' +
          prevBtn +
          '<a class="cw-btn" href="' + esc(homeHref) + '"><span class="cw-btn-text">📚 目录</span></a>' +
          nextBtn +
        '</div>' +
      '</div>';

    // 插入到 body 最前面
    var holder = document.createElement('div');
    holder.innerHTML = html;
    var bar = holder.firstElementChild;
    document.body.insertBefore(bar, document.body.firstChild);
    document.body.classList.add('cw-has-topbar');

    // logo 点击回主页
    var logo = document.getElementById('cwLogo');
    if (logo) logo.addEventListener('click', function () { window.location.href = homeHref; });
    var brand = bar.querySelector('.cw-brand');
    if (brand) brand.addEventListener('click', function () { window.location.href = homeHref; });

    // 键盘左右翻页
    document.addEventListener('keydown', function (e) {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/i.test(e.target.tagName)) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowLeft' && CURR_IDX > 0) {
        window.location.href = ROOT_URL + FLAT[CURR_IDX - 1].path;
      } else if (e.key === 'ArrowRight' && CURR_IDX >= 0 && CURR_IDX < FLAT.length - 1) {
        window.location.href = ROOT_URL + FLAT[CURR_IDX + 1].path;
      }
    });
  }

  function injectCss() {
    if (!ASSETS_URL) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = ASSETS_URL + 'courseware-common.css';
    document.head.appendChild(link);
  }

  function init() {
    try {
      injectCss();
      loadManifest(function () {
        try { buildFlat(); buildTopbar(); } catch (e) { /* 静默，不破坏原页面 */ }
      });
    } catch (e) { /* 静默，不破坏原页面 */ }
  }

  // DOM 就绪后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
