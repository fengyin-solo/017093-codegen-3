/**
 * 商家集合知识页面 - 模块化控制器
 * @module MerchantSetPage
 */
(function (global) {
  'use strict';

  var Utils = App.Utils;
  var Table = App.Table;
  var Modal = App.Modal;
  var Select = App.Select;

  // ====================== 页面状态 ======================
  var state = {
    sets: [],
    currentSetId: '',
    editingSetId: null,
    editingKnowledgeId: null
  };

  // ====================== DOM 元素缓存 ======================
  var elements = {};

  function cacheElements() {
    elements = {
      btnAddSet: document.getElementById('btnAddSet'),
      setTableBody: document.getElementById('setTableBody'),
      setSelect: document.getElementById('setSelect'),
      btnAddKnowledge: document.getElementById('btnAddKnowledge'),
      knowledgeEmpty: document.getElementById('knowledgeEmpty'),
      knowledgeBlock: document.getElementById('knowledgeBlock'),
      knowledgeTableBody: document.getElementById('knowledgeTableBody'),
      setModal: document.getElementById('setModal'),
      setModalTitle: document.getElementById('setModalTitle'),
      setFormName: document.getElementById('setFormName'),
      setFormMerchantsWrap: document.getElementById('setFormMerchantsWrap'),
      setFormMerchants: document.getElementById('setFormMerchants'),
      setModalCancel: document.getElementById('setModalCancel'),
      setModalSubmit: document.getElementById('setModalSubmit'),
      // 成员维护弹层
      memberModal: document.getElementById('memberModal'),
      memberModalTitle: document.getElementById('memberModalTitle'),
      memberMeta: document.getElementById('memberMeta'),
      memberEditView: document.getElementById('memberEditView'),
      memberResultView: document.getElementById('memberResultView'),
      memberCheckAll: document.getElementById('memberCheckAll'),
      memberCount: document.getElementById('memberCount'),
      memberSearch: document.getElementById('memberSearch'),
      memberList: document.getElementById('memberList'),
      candidateCheckAll: document.getElementById('candidateCheckAll'),
      candidateCount: document.getElementById('candidateCount'),
      candidateSearch: document.getElementById('candidateSearch'),
      candidateList: document.getElementById('candidateList'),
      memberPending: document.getElementById('memberPending'),
      memberModalCancel: document.getElementById('memberModalCancel'),
      memberModalSubmit: document.getElementById('memberModalSubmit'),
      memberResultStats: document.getElementById('memberResultStats'),
      memberResultBody: document.getElementById('memberResultBody'),
      memberResultBack: document.getElementById('memberResultBack'),
      memberResultDone: document.getElementById('memberResultDone'),
      // 知识弹层
      knowledgeModal: document.getElementById('knowledgeModal'),
      knowledgeModalTitle: document.getElementById('knowledgeModalTitle'),
      knowledgeFormSetWrap: document.getElementById('knowledgeFormSetWrap'),
      knowledgeFormSet: document.getElementById('knowledgeFormSet'),
      formStandardQ: document.getElementById('formStandardQ'),
      formSimilarQ: document.getElementById('formSimilarQ'),
      formAnswer: document.getElementById('formAnswer'),
      knowledgeModalCancel: document.getElementById('knowledgeModalCancel'),
      knowledgeModalSubmit: document.getElementById('knowledgeModalSubmit')
    };
  }

  // 刷新集合数据并联动集合列表、下拉与集合知识名称
  function refreshSets() {
    state.sets = MockStore.getMerchantSets();
    SetManager.render();
    SetManager.fillSelect();
    KnowledgeManager.render();
  }

  // ====================== 商家集合管理 ======================
  var SetManager = {
    render: function () {
      state.sets = MockStore.getMerchantSets();

      Table.render(elements.setTableBody, state.sets, function (s) {
        var count = (s.merchantIds || []).length;
        return '<td class="text-obsidian font-medium">' + Utils.escapeHtml(s.name) + '</td>' +
          '<td>' +
            '<button type="button" class="btn-link set-members-count" data-id="' + s.id + '" title="查看集合成员明细">' + count + '</button>' +
          '</td>' +
          '<td class="text-right">' +
            '<button type="button" class="btn-link set-members mr-2" data-id="' + s.id + '">成员维护</button>' +
            '<button type="button" class="btn-link set-edit mr-2" data-id="' + s.id + '">编辑</button>' +
            '<button type="button" class="btn-link btn-link-danger set-delete" data-id="' + s.id + '">删除</button>' +
          '</td>';
      }, this.bindTableEvents.bind(this));
    },

    bindTableEvents: function (tbody) {
      var self = this;
      tbody.querySelectorAll('.set-edit').forEach(function (btn) {
        btn.addEventListener('click', function () {
          self.openModal(btn.dataset.id);
        });
      });
      tbody.querySelectorAll('.set-members, .set-members-count').forEach(function (btn) {
        btn.addEventListener('click', function () {
          MemberManager.open(btn.dataset.id);
        });
      });
      tbody.querySelectorAll('.set-delete').forEach(function (btn) {
        btn.addEventListener('click', function () {
          Confirm.show('确定删除该商家集合？其下知识将一并清除。', function () {
            MockStore.deleteMerchantSet(btn.dataset.id);
            if (state.currentSetId === btn.dataset.id) {
              state.currentSetId = '';
            }
            refreshSets();
            Toast.show('商家集合删除成功', 'success');
          });
        });
      });
    },

    fillSelect: function () {
      var options = state.sets.map(function (s) {
        return { value: s.id, label: s.name };
      });
      Select.fill(elements.setSelect, options, '全部集合', state.currentSetId);
    },

    // 新建时可同时勾选初始商家；编辑时仅维护名称，成员调整走「成员维护」视图
    openModal: function (id) {
      state.editingSetId = id || null;
      elements.setModalTitle.textContent = id ? '编辑商家集合' : '新建商家集合';

      if (id) {
        elements.setFormMerchantsWrap.style.display = 'none';
        var set = state.sets.find(function (s) { return s.id === id; });
        elements.setFormName.value = set ? set.name : '';
      } else {
        elements.setFormMerchantsWrap.style.display = 'block';
        elements.setFormName.value = '';
        this.renderMerchantCheckboxes([]);
      }

      elements.setModal.style.display = 'flex';
    },

    renderMerchantCheckboxes: function (checkedIds) {
      var checkedMap = {};
      (checkedIds || []).forEach(function (id) { checkedMap[id] = true; });
      var html = MockStore.getMerchants().map(function (m) {
        var checked = checkedMap[m.id] ? ' checked' : '';
        return '<label class="flex items-center gap-2 cursor-pointer">' +
          '<input type="checkbox" class="set-merchant-cb" value="' + Utils.escapeHtml(m.id) + '"' + checked + ' />' +
          '<span class="text-sm">' + Utils.escapeHtml(m.name) + '（' + Utils.escapeHtml(m.id) + '）</span>' +
        '</label>';
      }).join('');
      elements.setFormMerchants.innerHTML = html || '<p class="text-sm text-subtle">暂无商家，请先在「商家知识」中创建。</p>';
    },

    closeModal: function () {
      elements.setModal.style.display = 'none';
      state.editingSetId = null;
    },

    save: function () {
      var name = elements.setFormName.value.trim();
      if (!name) {
        Toast.show('请填写集合名称', 'error');
        return;
      }

      if (state.editingSetId) {
        // 仅更新名称，商家成员保持不变；数量与集合知识在刷新时一并更新
        MockStore.updateMerchantSet(state.editingSetId, name);
        Toast.show('商家集合更新成功', 'success');
      } else {
        var ids = [];
        elements.setFormMerchants.querySelectorAll('.set-merchant-cb:checked').forEach(function (cb) {
          ids.push(cb.value);
        });
        MockStore.createMerchantSet(name, ids);
        Toast.show('商家集合创建成功', 'success');
      }

      this.closeModal();
      refreshSets();
    }
  };

  // ====================== 集合成员维护 ======================
  var memberState = {
    setId: null,
    setName: '',
    merchants: [],
    memberIds: [],
    removeChecked: {},   // 待移除商家 ID
    addChecked: {},      // 待加入商家 ID
    memberKeyword: '',
    candidateKeyword: '',
    results: null
  };

  var MemberManager = {
    // 按集合打开成员维护视图，加载最新成员明细
    open: function (setId) {
      var set = MockStore.getMerchantSets().find(function (s) { return s.id === setId; });
      if (!set) {
        Toast.show('未找到该商家集合', 'error');
        refreshSets();
        return;
      }
      memberState.setId = setId;
      memberState.setName = set.name;
      memberState.merchants = MockStore.getMerchants();
      memberState.memberIds = (set.merchantIds || []).slice();
      memberState.removeChecked = {};
      memberState.addChecked = {};
      memberState.memberKeyword = '';
      memberState.candidateKeyword = '';
      memberState.results = null;

      elements.memberModalTitle.textContent = '集合成员维护';
      elements.memberSearch.value = '';
      elements.candidateSearch.value = '';
      elements.memberEditView.classList.remove('hidden');
      elements.memberResultView.classList.add('hidden');
      elements.memberModal.style.display = 'flex';
      this.render();
    },

    close: function () {
      elements.memberModal.style.display = 'none';
      memberState.setId = null;
      memberState.results = null;
    },

    getSet: function () {
      return MockStore.getMerchantSets().find(function (s) { return s.id === memberState.setId; });
    },

    getMerchantMap: function () {
      var map = {};
      memberState.merchants.forEach(function (m) { map[m.id] = m; });
      return map;
    },

    filterMerchants: function (ids, keyword) {
      var kw = (keyword || '').trim().toLowerCase();
      var map = this.getMerchantMap();
      return ids.filter(function (id) {
        if (!kw) return true;
        var m = map[id];
        var name = m ? m.name.toLowerCase() : '';
        return name.indexOf(kw) !== -1 || String(id).toLowerCase().indexOf(kw) !== -1;
      });
    },

    render: function () {
      var set = this.getSet();
      if (!set) { this.close(); return; }
      memberState.memberIds = (set.merchantIds || []).slice();

      var memberMap = {};
      memberState.memberIds.forEach(function (id) { memberMap[id] = true; });
      var candidateIds = memberState.merchants
        .map(function (m) { return m.id; })
        .filter(function (id) { return !memberMap[id]; });

      elements.memberMeta.innerHTML = Utils.escapeHtml(set.name) +
        ' <span class="font-mono text-xs text-subtle">(' + Utils.escapeHtml(set.id) + ')</span>' +
        '<span class="mx-1 text-slate-300">|</span>当前成员 <span class="font-medium text-obsidian">' +
        memberState.memberIds.length + '</span> 家';
      elements.memberCount.textContent = '共 ' + memberState.memberIds.length + ' 家';
      elements.candidateCount.textContent = '共 ' + candidateIds.length + ' 家';

      this.renderList(elements.memberList, this.filterMerchants(memberState.memberIds, memberState.memberKeyword),
        memberState.removeChecked, 'remove', '暂无成员，从右侧候选商家勾选加入');
      this.renderList(elements.candidateList, this.filterMerchants(candidateIds, memberState.candidateKeyword),
        memberState.addChecked, 'add', '全部商家均已加入该集合');

      this.syncCheckAll(elements.memberCheckAll, elements.memberList, memberState.removeChecked);
      this.syncCheckAll(elements.candidateCheckAll, elements.candidateList, memberState.addChecked);
      this.renderPending();
    },

    renderList: function (container, ids, checkedMap, action, emptyText) {
      var map = this.getMerchantMap();
      if (ids.length === 0) {
        container.innerHTML = '<div class="member-list-empty">' + Utils.escapeHtml(emptyText) + '</div>';
        return;
      }
      var pendingText = action === 'remove' ? '待移除' : '待加入';
      container.innerHTML = ids.map(function (id) {
        var m = map[id] || { id: id, name: '（商家已删除）' };
        var pending = !!checkedMap[id];
        return '<label class="member-row' + (pending ? ' is-pending' : '') + '" data-id="' + Utils.escapeHtml(id) + '">' +
          '<input type="checkbox" class="member-cb" value="' + Utils.escapeHtml(id) + '"' + (pending ? ' checked' : '') + ' />' +
          '<span class="text-sm text-obsidian flex-1 truncate">' + Utils.escapeHtml(m.name) + '</span>' +
          '<span class="text-xs text-subtle font-mono">' + Utils.escapeHtml(id) + '</span>' +
          (pending ? '<span class="text-[11px] font-medium text-amber-700 bg-amber-100 rounded px-1.5 py-0.5">' + pendingText + '</span>' : '') +
        '</label>';
      }).join('');
    },

    syncCheckAll: function (checkbox, listEl, checkedMap) {
      var rows = listEl.querySelectorAll('.member-row');
      var visibleIds = [];
      rows.forEach(function (row) { visibleIds.push(row.dataset.id); });
      var allChecked = visibleIds.length > 0 && visibleIds.every(function (id) { return !!checkedMap[id]; });
      checkbox.checked = allChecked;
      checkbox.indeterminate = !allChecked && visibleIds.some(function (id) { return !!checkedMap[id]; });
      checkbox.disabled = visibleIds.length === 0;
    },

    renderPending: function () {
      var removeCount = Object.keys(memberState.removeChecked).length;
      var addCount = Object.keys(memberState.addChecked).length;
      var html = '';
      if (removeCount > 0) {
        html += '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-medium">待移除 ' + removeCount + ' 家</span>';
      }
      if (addCount > 0) {
        html += '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">待加入 ' + addCount + ' 家</span>';
      }
      if (!html) {
        html = '<span class="text-subtle">尚未勾选调整，勾选后可一次提交</span>';
      }
      elements.memberPending.innerHTML = html;
      var hasPending = removeCount + addCount > 0;
      elements.memberModalSubmit.disabled = !hasPending;
    },

    // 勾选/取消某一侧列表中的全部可见行
    toggleCheckAll: function (listEl, checkedMap, checked) {
      listEl.querySelectorAll('.member-row').forEach(function (row) {
        if (checked) checkedMap[row.dataset.id] = true;
        else delete checkedMap[row.dataset.id];
      });
      this.render();
    },

    // 多选后一次提交，逐条给出结果
    submit: function () {
      var ops = [];
      Object.keys(memberState.removeChecked).forEach(function (id) {
        ops.push({ merchantId: id, action: 'remove' });
      });
      Object.keys(memberState.addChecked).forEach(function (id) {
        ops.push({ merchantId: id, action: 'add' });
      });

      if (ops.length === 0) {
        Toast.show('请先勾选要加入或移除的商家', 'error');
        return;
      }

      var res = MockStore.adjustMerchantSetMembers(memberState.setId, ops);
      memberState.results = res.results || [];
      this.renderResults();

      // 外层集合列表与下拉中的商家数量同步为实际成员数
      SetManager.render();
      SetManager.fillSelect();

      var successCount = memberState.results.filter(function (r) { return r.status === 'success'; }).length;
      if (successCount > 0) {
        Toast.show('成员调整完成，成功 ' + successCount + ' 项', 'success');
      } else {
        Toast.show('提交的调整均未生效，请查看逐条结果', 'info');
      }
    },

    renderResults: function () {
      var results = memberState.results || [];
      var successCount = results.filter(function (r) { return r.status === 'success'; }).length;
      var skippedCount = results.filter(function (r) { return r.status === 'skipped'; }).length;
      var errorCount = results.filter(function (r) { return r.status === 'error'; }).length;

      var statsHtml = '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">成功 ' + successCount + ' 项</span>';
      if (skippedCount > 0) {
        statsHtml += '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium">跳过 ' + skippedCount + ' 项</span>';
      }
      if (errorCount > 0) {
        statsHtml += '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-medium">失败 ' + errorCount + ' 项</span>';
      }
      statsHtml += '<span class="text-subtle">共 ' + results.length + ' 项</span>';
      elements.memberResultStats.innerHTML = statsHtml;

      var map = this.getMerchantMap();
      var actionMeta = {
        add: { label: '加入', cls: 'text-emerald-700 bg-emerald-50' },
        remove: { label: '移除', cls: 'text-rose-700 bg-rose-50' }
      };
      var statusMeta = {
        success: { label: '成功', cls: 'text-emerald-700', icon: 'lucide:check-circle-2' },
        skipped: { label: '跳过', cls: 'text-amber-700', icon: 'lucide:minus-circle' },
        error: { label: '失败', cls: 'text-rose-700', icon: 'lucide:x-circle' }
      };

      elements.memberResultBody.innerHTML = results.map(function (r) {
        var m = map[r.merchantId];
        var name = m ? m.name : '（商家不存在）';
        var a = actionMeta[r.action] || { label: r.action, cls: 'text-subtle bg-slate-100' };
        var st = statusMeta[r.status] || statusMeta.error;
        return '<tr>' +
          '<td><span class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ' + a.cls + '">' + a.label + '</span></td>' +
          '<td class="text-obsidian">' + Utils.escapeHtml(name) +
            '<span class="text-xs text-subtle font-mono ml-2">' + Utils.escapeHtml(r.merchantId) + '</span></td>' +
          '<td><span class="inline-flex items-center gap-1 font-medium ' + st.cls + '">' +
            '<span class="iconify" data-icon="' + st.icon + '" data-width="14" data-height="14"></span>' + st.label +
          '</span></td>' +
          '<td class="text-subtle text-sm">' + Utils.escapeHtml(r.message || '') + '</td>' +
        '</tr>';
      }).join('');

      elements.memberEditView.classList.add('hidden');
      elements.memberResultView.classList.remove('hidden');
    },

    // 结果页「继续调整」：重新加载最新成员明细后回到勾选视图
    backToEdit: function () {
      memberState.results = null;
      memberState.removeChecked = {};
      memberState.addChecked = {};
      memberState.merchants = MockStore.getMerchants();
      var set = this.getSet();
      if (!set) { this.close(); refreshSets(); return; }
      memberState.setName = set.name;
      memberState.memberIds = (set.merchantIds || []).slice();
      elements.memberResultView.classList.add('hidden');
      elements.memberEditView.classList.remove('hidden');
      this.render();
    }
  };

  // ====================== 知识管理 ======================
  var KnowledgeManager = {
    render: function () {
      var list = [];
      var allSets = MockStore.getMerchantSets();

      if (state.currentSetId) {
        allSets.forEach(function (s) {
          if (s.id !== state.currentSetId) return;
          (MockStore.getMerchantSetKnowledge(s.id) || []).forEach(function (k) {
            list.push({ setId: s.id, setName: s.name, data: k });
          });
        });
      } else {
        allSets.forEach(function (s) {
          (MockStore.getMerchantSetKnowledge(s.id) || []).forEach(function (k) {
            list.push({ setId: s.id, setName: s.name, data: k });
          });
        });
      }

      Table.toggleEmpty(elements.knowledgeEmpty, elements.knowledgeBlock, list.length === 0);

      if (list.length === 0) {
        elements.knowledgeTableBody.innerHTML = '';
        return;
      }

      Table.render(elements.knowledgeTableBody, list, function (row) {
        var k = row.data;
        return '<td class="text-subtle text-sm">' + Utils.escapeHtml(row.setName) + '</td>' +
          '<td class="text-obsidian">' + Utils.escapeHtml(k.standardQ || '') + '</td>' +
          '<td class="text-subtle">' + Utils.escapeHtml((k.similarQs || []).join('；')) + '</td>' +
          '<td class="text-charcoal max-w-xs truncate">' + Utils.escapeHtml(k.answer || '') + '</td>' +
          '<td class="text-right">' +
            '<button type="button" class="btn-link k-edit mr-2" data-id="' + k.id + '" data-sid="' + row.setId + '">编辑</button>' +
            '<button type="button" class="btn-link btn-link-danger k-delete" data-id="' + k.id + '" data-sid="' + row.setId + '">删除</button>' +
          '</td>';
      }, this.bindTableEvents.bind(this));
    },

    bindTableEvents: function (tbody) {
      var self = this;
      tbody.querySelectorAll('.k-edit').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var sid = btn.dataset.sid || state.currentSetId;
          if (sid) {
            state.currentSetId = sid;
            elements.setSelect.value = sid;
          }
          self.openModal(btn.dataset.id);
        });
      });
      tbody.querySelectorAll('.k-delete').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var sid = btn.dataset.sid || state.currentSetId;
          Confirm.show('确定删除这条知识？', function () {
            MockStore.deleteMerchantSetKnowledge(sid, btn.dataset.id);
            self.render();
            Toast.show('知识删除成功', 'success');
          });
        });
      });
    },

    fillFormSelect: function () {
      var options = state.sets.map(function (s) {
        return { value: s.id, label: s.name };
      });
      Select.fill(elements.knowledgeFormSet, options, '请选择要添加知识的商家集合');
    },

    openModal: function (id) {
      state.editingKnowledgeId = id || null;
      elements.knowledgeModalTitle.textContent = id ? '编辑知识' : '新增知识';

      if (id) {
        elements.knowledgeFormSetWrap.style.display = 'none';
        var list = MockStore.getMerchantSetKnowledge(state.currentSetId);
        var k = list.find(function (x) { return x.id === id; });
        if (k) {
          elements.formStandardQ.value = k.standardQ || '';
          elements.formSimilarQ.value = (k.similarQs || []).join('\n');
          elements.formAnswer.value = k.answer || '';
        }
      } else {
        elements.knowledgeFormSetWrap.style.display = 'block';
        this.fillFormSelect();
        elements.knowledgeFormSet.value = '';
        elements.formStandardQ.value = '';
        elements.formSimilarQ.value = '';
        elements.formAnswer.value = '';
      }

      elements.knowledgeModal.style.display = 'flex';
    },

    closeModal: function () {
      elements.knowledgeModal.style.display = 'none';
      state.editingKnowledgeId = null;
    },

    save: function () {
      var standardQ = elements.formStandardQ.value.trim();
      var similarQs = elements.formSimilarQ.value.trim().split(/\n/).map(function (s) {
        return s.trim();
      }).filter(Boolean);
      var answer = elements.formAnswer.value.trim();

      if (!standardQ) {
        Toast.show('请填写标准问', 'error');
        return;
      }

      var setId = state.editingKnowledgeId
        ? state.currentSetId
        : (elements.knowledgeFormSet.value || '').trim();

      if (!setId) {
        Toast.show('请选择要添加知识的商家集合', 'error');
        return;
      }

      if (state.editingKnowledgeId) {
        MockStore.updateMerchantSetKnowledge(setId, state.editingKnowledgeId, {
          standardQ: standardQ,
          similarQs: similarQs,
          answer: answer
        });
        Toast.show('知识更新成功', 'success');
      } else {
        MockStore.addMerchantSetKnowledge(setId, {
          standardQ: standardQ,
          similarQs: similarQs,
          answer: answer
        });
        Toast.show('知识创建成功', 'success');
      }

      this.closeModal();
      this.render();
    }
  };

  // ====================== 事件绑定 ======================
  function bindEvents() {
    elements.btnAddSet.addEventListener('click', function () {
      SetManager.openModal();
    });
    elements.setModalCancel.addEventListener('click', function () {
      SetManager.closeModal();
    });
    elements.setModalSubmit.addEventListener('click', function () {
      SetManager.save();
    });
    Modal.bindOverlayClose(elements.setModal, function () {
      SetManager.closeModal();
    });

    elements.setSelect.addEventListener('change', function () {
      state.currentSetId = elements.setSelect.value || '';
      KnowledgeManager.render();
    });
    elements.btnAddKnowledge.addEventListener('click', function () {
      KnowledgeManager.openModal();
    });
    elements.knowledgeModalCancel.addEventListener('click', function () {
      KnowledgeManager.closeModal();
    });
    elements.knowledgeModalSubmit.addEventListener('click', function () {
      KnowledgeManager.save();
    });
    Modal.bindOverlayClose(elements.knowledgeModal, function () {
      KnowledgeManager.closeModal();
    });

    // 成员维护：勾选、全选、搜索均通过事件委托，列表重渲染后无需重绑
    elements.memberList.addEventListener('change', function (e) {
      if (e.target.classList.contains('member-cb')) {
        if (e.target.checked) memberState.removeChecked[e.target.value] = true;
        else delete memberState.removeChecked[e.target.value];
        MemberManager.render();
      }
    });
    elements.candidateList.addEventListener('change', function (e) {
      if (e.target.classList.contains('member-cb')) {
        if (e.target.checked) memberState.addChecked[e.target.value] = true;
        else delete memberState.addChecked[e.target.value];
        MemberManager.render();
      }
    });
    elements.memberCheckAll.addEventListener('change', function () {
      MemberManager.toggleCheckAll(elements.memberList, memberState.removeChecked, elements.memberCheckAll.checked);
    });
    elements.candidateCheckAll.addEventListener('change', function () {
      MemberManager.toggleCheckAll(elements.candidateList, memberState.addChecked, elements.candidateCheckAll.checked);
    });
    elements.memberSearch.addEventListener('input', function () {
      memberState.memberKeyword = elements.memberSearch.value;
      MemberManager.render();
    });
    elements.candidateSearch.addEventListener('input', function () {
      memberState.candidateKeyword = elements.candidateSearch.value;
      MemberManager.render();
    });
    elements.memberModalCancel.addEventListener('click', function () {
      MemberManager.close();
    });
    elements.memberModalSubmit.addEventListener('click', function () {
      MemberManager.submit();
    });
    elements.memberResultBack.addEventListener('click', function () {
      MemberManager.backToEdit();
    });
    elements.memberResultDone.addEventListener('click', function () {
      MemberManager.close();
    });
    Modal.bindOverlayClose(elements.memberModal, function () {
      MemberManager.close();
    });
  }

  // ====================== 初始化 ======================
  function init() {
    cacheElements();
    // 全部集合的商家数量按实际包含的商家重新计算（去重、剔除已删除商家）
    MockStore.reconcileMerchantSets();
    bindEvents();
    SetManager.render();
    SetManager.fillSelect();
    KnowledgeManager.render();
  }

  // ====================== 导出模块 ======================
  global.MerchantSetPage = {
    init: init,
    state: state,
    SetManager: SetManager,
    MemberManager: MemberManager,
    KnowledgeManager: KnowledgeManager
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
