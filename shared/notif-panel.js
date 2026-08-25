/* ─────────────────────────────────────────────────────────────
   AIMS-OS Shared Notification Panel  •  DS spec: node 18179:8837
   Version: 2026-08-05

   Usage in each studio HTML:
     1. Define window.NOTIF_DATA = [...] with studio-specific items
        BEFORE this script loads (or let it use the built-in fallback).
     2. Ensure the bell HTML is present (see shared/notif-panel-bell.html).
     3. Add <script src="shared/notif-panel.js"></script> near </body>.
   ───────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  /* ── Data model ───────────────────────────────────────────────
     Each item: {
       id:        string         unique key
       source:    'agent'|'workflow'|'human'|'integration'|'system'
       eventType: 'completion'|'failure'|'approval'|'assignment'
                  |'reminder'|'security'|'update'|'escalation'
       severity:  'info'|'success'|'warning'|'critical'
       title:     string         ≤60 chars, truncated in UI
       desc:      string         ≤120 chars, 2-line clamp
       time:      string         human-readable ("2m ago", "1h ago")
       day:       'today'|'yesterday'|'earlier'
       unread:    boolean
     }
  ─────────────────────────────────────────────────────────────── */

  /* Built-in fallback dataset (used when window.NOTIF_DATA is absent) */
  var FALLBACK_DATA = [
    { id:'n1', source:'agent',       eventType:'completion', severity:'success',  title:'Lead Qualifier run complete',          desc:'47 records processed from Salesforce. 12 qualified leads created.', time:'2m ago',  day:'today',     unread:true  },
    { id:'n2', source:'workflow',    eventType:'approval',   severity:'warning',  title:'Approval required: Contract renewal',  desc:'Q3 renewal for Contoso Ltd. needs sign-off before midnight.',        time:'18m ago', day:'today',     unread:true  },
    { id:'n3', source:'system',      eventType:'security',   severity:'critical', title:'Auth token expiring in 2 hours',       desc:'Salesforce connector token expires at 23:00 UTC. Re-auth now.',      time:'34m ago', day:'today',     unread:true  },
    { id:'n4', source:'integration', eventType:'failure',    severity:'warning',  title:'HubSpot sync failed',                  desc:'Webhook delivery failed (429 Too Many Requests). Will retry in 15m.',time:'1h ago',  day:'today',     unread:false },
    { id:'n5', source:'human',       eventType:'assignment', severity:'info',     title:'Task assigned by Sarah K.',            desc:'Review the Q3 pipeline report and add your commentary by EOD.',       time:'3h ago',  day:'today',     unread:false },
    { id:'n6', source:'agent',       eventType:'failure',    severity:'critical', title:'Invoice Processor halted',             desc:'Unhandled exception on line 34. 3 invoices pending. View logs.',      time:'Yesterday', day:'yesterday', unread:true  },
    { id:'n7', source:'workflow',    eventType:'completion', severity:'success',  title:'Onboarding sequence finished',         desc:'All 8 steps completed for Northwind Corp. 0 manual interventions.',   time:'Yesterday', day:'yesterday', unread:false },
    { id:'n8', source:'system',      eventType:'update',     severity:'info',     title:'Platform updated to v2.14.0',          desc:'New: Governance Studio audit trail, improved agent retry logic.',      time:'2d ago',  day:'earlier',   unread:false },
  ];

  var _data = (Array.isArray(window.NOTIF_DATA) && window.NOTIF_DATA.length > 0)
    ? window.NOTIF_DATA
    : FALLBACK_DATA;

  var _filter = 'all'; // 'all' | 'unread'

  /* ── Source icons ──────────────────────────────────────────── */
  var SRC_ICO = {
    agent: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><circle cx="19" cy="8" r="2" fill="currentColor" stroke="none"/></svg>',
    workflow: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="6" height="6" rx="1.5"/><rect x="16" y="11" width="6" height="6" rx="1.5"/><path d="M8 10h4M12 10v4h4"/></svg>',
    human: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    integration: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
    system: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>',
  };

  var SEV_LABELS = { info:'Info', success:'Success', warning:'Warning', critical:'Critical' };

  /* ── Render ────────────────────────────────────────────────── */
  function _render() {
    var menu = document.getElementById('notif-menu');
    if (!menu) return;

    var filtered = _filter === 'unread' ? _data.filter(function(n){ return n.unread; }) : _data;
    var unreadCount = _data.filter(function(n){ return n.unread; }).length;

    /* header */
    var html = '<div class="notif-menu-hd">'
      + '<span class="notif-menu-title">Notifications</span>'
      + '<button type="button" class="notif-hd-action" aria-label="Mark all read" onclick="event.stopPropagation();_notifMarkAllRead()" title="Mark all read">'
        + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/><polyline points="20 6 9 17 4 12" opacity=".4" transform="translate(4,0)"/></svg>'
      + '</button>'
      + '<button type="button" class="notif-hd-action" aria-label="Open notifications" onclick="event.stopPropagation();_notifOpenFull()" title="Open full view">'
        + '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3h7v7"/><path d="M21 3l-9 9"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>'
      + '</button>'
    + '</div>';

    /* filter chips */
    html += '<div class="notif-filter-bar">'
      + '<button type="button" class="notif-chip' + (_filter==='all'?' is-active':'') + '" onclick="event.stopPropagation();_notifSetFilter(\'all\')">All</button>'
      + '<button type="button" class="notif-chip' + (_filter==='unread'?' is-active':'') + '" onclick="event.stopPropagation();_notifSetFilter(\'unread\')">'
        + 'Unread'
        + (unreadCount > 0 ? '<span class="notif-chip-count">' + (unreadCount > 9 ? '9+' : unreadCount) + '</span>' : '')
      + '</button>'
    + '</div>';

    /* feed */
    html += '<div class="notif-feed">';

    if (filtered.length === 0) {
      html += _renderEmptyState();
    } else {
      var days = ['today', 'yesterday', 'earlier'];
      var DAY_LABELS = { today:'Today', yesterday:'Yesterday', earlier:'Earlier' };
      days.forEach(function(day) {
        var group = filtered.filter(function(n){ return n.day === day; });
        if (group.length === 0) return;
        html += '<div class="notif-time-sep">' + DAY_LABELS[day] + '</div>';
        group.forEach(function(n) { html += _renderItem(n); });
      });
    }

    html += '</div>'; /* end notif-feed */

    /* footer */
    html += '<div class="notif-menu-footer">'
      + '<button type="button" class="notif-footer-link" onclick="event.stopPropagation();_notifOpenFull()">View all notifications</button>'
    + '</div>';

    menu.innerHTML = html;

    /* bell dot */
    var dot = document.getElementById('notif-bell-dot');
    if (dot) {
      var n = unreadCount;
      dot.textContent = n > 0 ? (n > 9 ? '9+' : String(n)) : '';
      dot.classList.toggle('is-empty', n === 0);
    }
  }

  function _renderItem(n) {
    var src = n.source || 'system';
    var ico = SRC_ICO[src] || SRC_ICO.system;
    var sev = n.severity || 'info';
    return '<div class="notif-item' + (n.unread ? ' is-unread' : '') + '" role="button" tabindex="0"'
      + ' onclick="_notifMarkRead(\'' + n.id + '\')"'
      + ' onkeydown="if(event.key===\'Enter\'||event.key===\' \')_notifMarkRead(\'' + n.id + '\')">'
      + '<div class="notif-src-ico src-' + src + '">' + ico + '</div>'
      + '<div class="notif-item-body">'
        + '<div class="notif-item-title">' + _esc(n.title) + '</div>'
        + '<div class="notif-item-desc">' + _esc(n.desc) + '</div>'
        + '<div class="notif-item-meta">'
          + '<span class="notif-sev sev-' + sev + '">' + (SEV_LABELS[sev] || sev) + '</span>'
          + '<span class="notif-item-time">' + _esc(n.time) + '</span>'
        + '</div>'
      + '</div>'
      + (n.unread ? '<div class="notif-unread-dot" aria-label="Unread"></div>' : '')
    + '</div>';
  }

  function _renderEmptyState() {
    return '<div class="notif-feed-state">'
      + '<div class="notif-feed-state-ico ico-empty">'
        + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>'
      + '</div>'
      + '<div class="notif-feed-state-title">You\'re all caught up</div>'
      + '<div class="notif-feed-state-desc">No ' + (_filter === 'unread' ? 'unread ' : '') + 'notifications right now.</div>'
    + '</div>';
  }

  function _esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Actions ───────────────────────────────────────────────── */
  window._notifSetFilter = function(f) { _filter = f; _render(); };

  window._notifMarkRead = function(id) {
    var n = _data.find(function(x){ return x.id === id; });
    if (n) { n.unread = false; _render(); }
  };

  window._notifMarkAllRead = function() {
    _data.forEach(function(n){ n.unread = false; });
    _render();
  };

  window._notifOpenFull = function() {
    _closeNotifications();
    if (typeof toast === 'function') toast('Notifications inbox — coming soon');
  };

  /* ── Open / close ──────────────────────────────────────────── */
  function _openNotifications() {
    /* close any other open menus if they expose a close fn */
    ['_ctxClose','_avatarClose','_gearClose'].forEach(function(fn){
      if (typeof window[fn] === 'function') window[fn]();
    });
    _render();
    var menu = document.getElementById('notif-menu');
    if (menu) { menu.classList.add('open'); menu.setAttribute('aria-hidden','false'); }
    var btn = document.getElementById('notifBellLauncher');
    if (btn) btn.setAttribute('aria-expanded','true');
    setTimeout(function(){ document.addEventListener('click', _outsideClick); }, 0);
  }

  function _closeNotifications() {
    var menu = document.getElementById('notif-menu');
    if (menu) { menu.classList.remove('open'); menu.setAttribute('aria-hidden','true'); }
    var btn = document.getElementById('notifBellLauncher');
    if (btn) btn.setAttribute('aria-expanded','false');
    document.removeEventListener('click', _outsideClick);
  }

  window._toggleNotifications = function(e) {
    if (e) e.stopPropagation();
    var menu = document.getElementById('notif-menu');
    if (menu && menu.classList.contains('open')) _closeNotifications();
    else _openNotifications();
  };

  function _outsideClick(e) {
    var wrap = document.querySelector('.notif-bell-wrap');
    if (wrap && !wrap.contains(e.target)) _closeNotifications();
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var menu = document.getElementById('notif-menu');
      if (menu && menu.classList.contains('open')) _closeNotifications();
    }
  });

  /* ── Init ──────────────────────────────────────────────────── */
  if (document.getElementById('notif-bell-dot')) _render();

}());
