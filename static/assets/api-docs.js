(function() {
    // --- Helpers ---
    function isObjectType(t) {
        t = t.toLowerCase();
        return t.indexOf('object') !== -1;
    }

    function typeToJsonValue(type, children) {
        var t = type.toLowerCase().trim();
        // Object types checked first (even if nullable like "null | object")
        if (t.indexOf('array of objects') !== -1) {
            var inner = {};
            if (children && children.length) {
                children.forEach(function(c) { inner[c.name] = typeToJsonValue(c.type, c.children); });
            }
            return [inner];
        }
        if (t.indexOf('object') !== -1) {
            var obj = {};
            if (children && children.length) {
                children.forEach(function(c) { obj[c.name] = typeToJsonValue(c.type, c.children); });
            }
            return obj;
        }
        // Simple nullable types → null
        if (t.indexOf('null') !== -1) return null;
        if (t.indexOf('integer') !== -1 || t.indexOf('number') !== -1) return 0;
        if (t.indexOf('boolean') !== -1) return false;
        if (t.indexOf('string') !== -1) return 'string';
        if (t.indexOf('array') !== -1) return [];
        if (t.indexOf('enum') !== -1) return 'value';
        return 'string';
    }

    function treeToJson(fields) {
        var root = {};
        fields.forEach(function(f) { root[f.name] = typeToJsonValue(f.type, f.children); });
        return JSON.stringify(root, null, 2);
    }

    // --- Parse table into tree (multi-level nesting) ---
    function parseApiTree(table) {
        var rows = table.querySelectorAll('tbody tr');
        if (!rows.length) rows = table.querySelectorAll('tr:not(:first-child)');
        var fields = [];
        var parentStack = []; // parentStack[depth] = field at that depth
        var hasNesting = false;

        for (var i = 0; i < rows.length; i++) {
            var cells = rows[i].querySelectorAll('td');
            if (cells.length < 2) continue;
            var rawName = cells[0].textContent.trim();
            var rawType = cells[1].textContent.trim();
            var desc = cells[2] ? cells[2].textContent.trim() : '';

            // Count depth: each "- " prefix adds one level
            var depth = 0;
            var remaining = rawName;
            while (/^[-–—]\s*/.test(remaining)) {
                depth++;
                remaining = remaining.replace(/^[-–—]\s*/, '');
            }
            var name = remaining.replace(/`/g, '').trim();
            if (!name) continue;

            var field = { name: name, type: rawType, desc: desc, children: [], row: rows[i] };

            if (depth === 0) {
                fields.push(field);
                parentStack = isObjectType(rawType) ? [field] : [];
            } else {
                hasNesting = true;
                // Find parent at depth-1
                var parent = parentStack[depth - 1];
                if (parent) {
                    parent.children.push(field);
                } else {
                    // Fallback: attach to nearest available parent
                    for (var d = depth - 2; d >= 0; d--) {
                        if (parentStack[d]) { parentStack[d].children.push(field); break; }
                    }
                }
                // This field can be a parent for deeper levels
                if (isObjectType(rawType)) {
                    parentStack[depth] = field;
                    // Clear deeper levels
                    parentStack.length = depth + 1;
                }
            }
        }
        return { fields: fields, hasNesting: hasNesting };
    }

    // --- Detect API table ---
    function isApiTable(table) {
        var ths = table.querySelectorAll('thead th');
        if (!ths.length) {
            var firstRow = table.querySelector('tr');
            if (firstRow) ths = firstRow.querySelectorAll('th');
        }
        if (ths.length < 3) return false;
        var h0 = ths[0].textContent.trim().toLowerCase();
        var h1 = ths[1].textContent.trim().toLowerCase();
        return h0 === 'name' && h1 === 'type';
    }

    function isParamTable(table) {
        var ths = table.querySelectorAll('thead th');
        if (!ths.length) {
            var firstRow = table.querySelector('tr');
            if (firstRow) ths = firstRow.querySelectorAll('th');
        }
        for (var i = 0; i < ths.length; i++) {
            if (ths[i].textContent.trim().toLowerCase() === 'required') return true;
        }
        return false;
    }

    function wrapInScroll(el) {
        var wrapper = document.createElement('div');
        wrapper.style.overflowX = 'auto';
        wrapper.style.webkitOverflowScrolling = 'touch';
        el.parentNode.insertBefore(wrapper, el);
        wrapper.appendChild(el);
        return wrapper;
    }

    // --- Rebuild table: remove nested rows, add SCHEMA links ---
    function removeChildRows(children) {
        children.forEach(function(c) {
            if (c.children && c.children.length) removeChildRows(c.children);
            if (c.row && c.row.parentNode) c.row.parentNode.removeChild(c.row);
        });
    }

    function rebuildTable(table, fields) {
        fields.forEach(function(f) {
            // Recursively remove all nested child rows from DOM
            removeChildRows(f.children);
            // Add SCHEMA link for fields with children
            if (f.children.length > 0 && f.row) {
                var typeCell = f.row.querySelectorAll('td')[1];
                if (typeCell) {
                    var link = document.createElement('a');
                    link.className = 'schema-link';
                    link.textContent = 'SCHEMA';
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        showSchema(f.name, f.type, f.children, [{ name: f.name, type: f.type, children: f.children }]);
                    });
                    typeCell.appendChild(document.createTextNode(' '));
                    typeCell.appendChild(link);
                }
            }
        });
    }

    // --- Schema modal ---
    var backdrop = null;
    var modal = null;
    var navStack = [];

    function closeSchema() {
        if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        backdrop = null;
        modal = null;
        navStack = [];
    }

    function renderSchema() {
        var current = navStack[navStack.length - 1];
        if (!current) return;

        // Build modal if not exists
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'schema-backdrop';
            backdrop.addEventListener('click', function(e) {
                if (e.target === backdrop) closeSchema();
            });
            modal = document.createElement('div');
            modal.className = 'schema-modal';
            backdrop.appendChild(modal);
            document.body.appendChild(backdrop);
        }

        // Header
        var html = '<div class="schema-modal-header">';
        html += '<div class="schema-modal-header-left">';
        // Breadcrumb
        if (navStack.length > 0) {
            html += '<div class="schema-breadcrumb">';
            for (var i = 0; i < navStack.length; i++) {
                if (i > 0) html += '<span class="schema-breadcrumb-sep">/</span>';
                html += '<span>' + escHtml(navStack[i].name) + '</span>';
            }
            html += '</div>';
        }
        // Title
        var titleName = current.name.charAt(0).toUpperCase() + current.name.slice(1);
        html += '<div class="schema-modal-title">' + escHtml(titleName) + ': ' + escHtml(current.type.toLowerCase()) + '</div>';
        html += '</div>';
        // Actions
        html += '<div class="schema-modal-actions">';
        if (navStack.length > 1) {
            html += '<button class="schema-back-btn" data-action="back">\u2190 BACK</button>';
        }
        html += '<button class="schema-close-btn" data-action="close">\u2715</button>';
        html += '</div></div>';

        // Table
        html += '<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody>';
        current.children.forEach(function(child, idx) {
            html += '<tr><td><code>' + escHtml(child.name) + '</code></td>';
            html += '<td>' + escHtml(child.type);
            if (child.children && child.children.length > 0) {
                html += ' <a class="schema-link" data-child-idx="' + idx + '">SCHEMA</a>';
            }
            html += '</td>';
            html += '<td>' + escHtml(child.desc) + '</td></tr>';
        });
        html += '</tbody></table>';

        modal.innerHTML = html;

        // Wire up events
        var backBtn = modal.querySelector('[data-action="back"]');
        if (backBtn) backBtn.addEventListener('click', function() {
            navStack.pop();
            if (navStack.length === 0) closeSchema();
            else renderSchema();
        });
        var closeBtn = modal.querySelector('[data-action="close"]');
        if (closeBtn) closeBtn.addEventListener('click', closeSchema);

        modal.querySelectorAll('.schema-link[data-child-idx]').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var child = current.children[parseInt(link.getAttribute('data-child-idx'))];
                if (child) {
                    navStack.push({ name: child.name, type: child.type, children: child.children });
                    renderSchema();
                }
            });
        });
    }

    function showSchema(name, type, children, breadcrumbs) {
        navStack = breadcrumbs.slice();
        renderSchema();
    }

    function escHtml(str) {
        var d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    // Escape key closes modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && backdrop) closeSchema();
    });

    // --- Process all tables ---
    document.querySelectorAll('.post-body table').forEach(function(table) {
        if (!isApiTable(table) || isParamTable(table)) {
            wrapInScroll(table);
            return;
        }

        // Parse tree before modifying DOM
        var parsed = parseApiTree(table);
        var json = treeToJson(parsed.fields);

        // Rebuild table: remove nested rows, add SCHEMA links
        if (parsed.hasNesting) {
            rebuildTable(table, parsed.fields);
        }

        // Toggle buttons
        var toggle = document.createElement('div');
        toggle.className = 'table-view-toggle';
        var btnTable = document.createElement('button');
        btnTable.textContent = 'Table';
        btnTable.className = 'active';
        var btnJson = document.createElement('button');
        btnJson.textContent = 'JSON';
        toggle.appendChild(btnTable);
        toggle.appendChild(btnJson);

        // JSON view
        var jsonView = document.createElement('div');
        jsonView.className = 'table-json-view';
        var pre = document.createElement('pre');
        pre.style.margin = '0';
        pre.style.padding = '0.9rem 1rem';
        pre.style.border = '1px solid var(--border-color)';
        pre.style.borderRadius = '4px';
        pre.style.background = 'var(--code-block-bg)';
        pre.style.overflowX = 'auto';
        var code = document.createElement('code');
        code.style.fontSize = '0.85rem';
        code.style.lineHeight = '1.55';
        code.style.color = 'var(--code-text)';
        code.textContent = json;
        pre.appendChild(code);
        jsonView.appendChild(pre);

        // Wrap table in scroll container
        var scrollWrapper = wrapInScroll(table);

        // Insert toggle and JSON view
        scrollWrapper.parentNode.insertBefore(toggle, scrollWrapper);
        scrollWrapper.parentNode.insertBefore(jsonView, scrollWrapper.nextSibling);

        // Toggle logic
        btnTable.addEventListener('click', function() {
            scrollWrapper.style.display = '';
            jsonView.style.display = 'none';
            btnTable.className = 'active';
            btnJson.className = '';
        });
        btnJson.addEventListener('click', function() {
            scrollWrapper.style.display = 'none';
            jsonView.style.display = 'block';
            btnJson.className = 'active';
            btnTable.className = '';
        });
    });
})();
