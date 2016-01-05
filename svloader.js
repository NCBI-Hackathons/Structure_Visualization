
/*  $Id: svloader.js 34117 2015-11-05 18:20:29Z borodine $
 * ===========================================================================
 *
 *                            PUBLIC DOMAIN NOTICE
 *               National Center for Biotechnology Information
 *
 *  This software/database is a "United States Government Work" under the
 *  terms of the United States Copyright Act.  It was written as part of
 *  the author's official duties as a United States Government employee and
 *  thus cannot be copyrighted.  This software/database is freely available
 *  to the public for use. The National Library of Medicine and the U.S.
 *  Government have not placed any restriction on its use or reproduction.
 *
 *  Although all reasonable efforts have been taken to ensure the accuracy
 *  and reliability of the software and data, the NLM and the U.S.
 *  Government do not and cannot warrant the performance or results that
 *  may be obtained by using this software or data. The NLM and the U.S.
 *  Government disclaim all warranties, express or implied, including
 *  warranties of performance, merchantability or fitness for any particular
 *  purpose.
 *
 *  Please cite the author in any work or product based on this material.
 *
 * ===========================================================================
 *
 * File Description: Dynamic scripts loader and synchronizer
 */

USE_EXTJS5 = false;
//USE_EXTJS5 = true;
timeStamp = new Date().getTime();
function SeqViewOnReady(callback, scope) {
    if (typeof SeqView === 'undefined')
        setTimeout(function() { SeqViewOnReady(callback, scope); }, 100);
    else Ext.onReady(callback, scope);
}

(function(){
    var msgBuff = [];
    var debugMsg = function(msg) {
        return;
        msgBuff.push(msg);
        if (!msgDiv && document.body) {
            var msgDiv = document.body.appendChild(document.createElement('div'));
        }
        if (msgDiv) {
            while(typeof(msg = msgBuff.shift()) !== 'undefined')
                msgDiv.innerText += '\n' + msg;
        }
    };
    var isIE = (window.navigator.userAgent.indexOf('Trident/') >= 0);

    debugMsg('Initialization');
    if (typeof SeqView !== 'undefined') return;
   
    var docScripts = document.getElementsByTagName('script');
    var refNode = document.scripts[document.scripts.length - 1];
    var srcjs = refNode.src.split('/');
    var webNCBI = '//' + srcjs[2] + '/';
    var dotJS = (webNCBI.search(/www|qa/) !== 2 || document.location.href.indexOf('debug') > 0) ? '-debug.js' : '.js'
    var svPath = webNCBI;
    for (var i = 3; i < srcjs.length - 2; i++)
        svPath += srcjs[i] + (srcjs[i] ? '/' : '');
    var extPath = webNCBI + 'core/extjs/ext-3.4.2/';
    var thirdPartyScripts = {
        gapi: {tag: 'script', attr: {type: 'text/javascript', src: 'https://apis.google.com/js/client.js'}},
        jQuery: {tag: 'script', attr: {type: 'text/javascript', src: webNCBI + 'core/jquery/jquery-1.7.2.js'}},
        UUD: {tag: 'script',  attr: {type: 'text/javascript', src: webNCBI +'projects/genome/uud/js/uud-extern.js'}},
        UUD9: {tag: 'script',  attr: {type: 'text/javascript', src: webNCBI +'projects/genome/uud/js/uud.js'}},
        TMS: {tag: 'script', attr: {type: 'text/javascript', src: webNCBI + 'projects/genome/trackmgr/0.7/js/tms-extern.js'}},
        ncbi: {tag: 'script', attr: {type: 'text/javascript', src: webNCBI + 'portal/portal3rc.fcgi/rlib/js/InstrumentOmnitureBaseJS/InstrumentNCBIBaseJS/InstrumentPageStarterJS.js'}}};
    var svResources = [
        {tag: 'link', attr: {rel: 'stylesheet', type: 'text/css', href: svPath + 'css/sv-cleanup.css'}},
        {tag: 'link', attr: {rel: 'stylesheet', type: 'text/css', href: extPath + 'resources/css/ext-all.css'}},
        {tag: 'link', attr: {rel: 'stylesheet', type: 'text/css', href: extPath + 'resources/css/xtheme-gray.css', id: 'theme'}},
        {tag: 'link', attr: {rel: 'stylesheet', type: 'text/css', href: svPath + 'css/style.css', media: 'screen, projection, print'}}];
    var extScripts = [
        {tag: 'script', attr: {type: 'text/javascript', src: extPath + 'adapter/ext/ext-base' + dotJS}},
        {tag: 'script', attr: {type: 'text/javascript', src: extPath + 'ext-all' + dotJS}}];
if (USE_EXTJS5)
{
    var extPath = webNCBI + 'core/extjs/ext-5.0.1/build/';
    var svResources = [
        {tag: 'link', attr: {rel: 'stylesheet', type: 'text/css', href: svPath + 'css/sv-cleanup.css'}},
        {tag: 'link', attr: {rel: 'stylesheet', type: 'text/css', href: extPath + 'packages/ext-theme-gray/build/resources/ext-theme-gray-all.css'}},
        {tag: 'link', attr: {rel: 'stylesheet', type: 'text/css', href: svPath + 'css/style.css'}}];
    var extScripts = [
        {tag: 'script', attr: {type: 'text/javascript', src: extPath + 'ext-all' + dotJS}},
        {tag: 'script', attr: {type: 'text/javascript', src: extPath + 'packages/ext-theme-gray/build/ext-theme-gray.js'}}];
}
/*
    var loadScript = function(path, callback) {
        var transport = new XMLHttpRequest();
        transport.onreadystatechange = function() {
            if (this.readyState!=4 || this.status!=200) return;
            eval(this.responseText);
            callback();
        }
        transport.open('GET', path, true);
	    transport.send(null);
    }*/

    var insertElement = function(res, callback) {
        if (typeof res == 'string') {
            if (typeof window[res] !== 'undefined') {
                if (callback) callback();
                return;
             }
             res = thirdPartyScripts[res];
        }
        var el = document.createElement(res.tag);
        for (var p in res.attr) el[p] = res.attr[p];
        if (typeof callback === 'function') {
            el.onload = el.onreadystatechange = function() {
                if (!this.readyState || this.readyState === "loaded" || this.readyState === "complete") {
                    if (isIE)
                        try {
                            var tmp = document.body.appendChild(document.createElement('div'));
                            tmp.innerText = ' ';
                            document.body.removeChild(tmp);
                        } catch(e){};
                    this.onreadystatechange = this.onload = null;
                    callback();
                }
            }
        }
        refNode.parentNode.insertBefore(el, refNode);
    }
    
    var onReady = function() {
        initSeqView();
//        Ext.onReady(function() { 
            SeqView.loadGAPI = function(url, callback) {
                insertElement('gapi', function(){ SeqView.makeTinyURL(url, callback); });
            }
            insertElement('jQuery',
                function(){
                    insertElement(Ext.isIE9 ? 'UUD9' : 'UUD', function(){ insertElement('TMS'); });
                    
                    if (document.location.hostname.search(SeqView.NCBI.domain) == -1) {
                        __ncbi_stat_url = "https://www.ncbi.nlm.nih.gov/stat";
                        ncbi_pingWithImage = true;    
                    };
                    insertElement('ncbi');
                }
            );
//        });
        SeqView.extPath = extPath;
        if (srcjs[srcjs.length - 1] != 'sviewer.js' || refNode.id == 'autoload')
            Ext.onReady(function () {
                var items = Ext.query('div[class=SeqViewerApp]');
                for (var i = 0; i < items.length; i++) {
                     var id = items[i].id || Ext.id();
                     if (SeqView.App.findAppByDivId(id)) return; 
                     items[i].id = id;
                     var app = new SeqView.App(id);
                     app.load();
                }
            });
    };
    var counter = 30;
    var finalLoad = function() {
        if ((typeof Ext === 'undefined' || !Ext.onReady) && counter--) {
        debugMsg('finalLoad: counter' + counter);
            setTimeout(finalLoad, 100);
            return;
        }
        debugMsg('finalLoad: isIE = ' + isIE + ', window.addEventListener' + window.addEventListener);
        if (isIE && window.addEventListener) {
            window.addEventListener("load", onReady, false);
            return;
        }
        onReady();
    }

    if (typeof Ext !== 'undefined') {
        onReady();//finalLoad();
        return;
    }

    for (var i = 0; i < svResources.length; i++) insertElement(svResources[i]);
        insertElement(extScripts[0], function(){insertElement(extScripts[1], finalLoad);});
//    loadScript(extScripts[0].attr.src, function(){ loadScript(extScripts[1].attr.src, finalLoad);});
    
       
})();
function initSeqView()
{



/*  $Id: Ext.ux.dd.GridDragDropRowOrder.js 30279 2014-04-23 19:51:15Z borodine $
 * ===========================================================================
 *
 *                            PUBLIC DOMAIN NOTICE
 *               National Center for Biotechnology Information
 *
 *  This software/database is a "United States Government Work" under the
 *  terms of the United States Copyright Act.  It was written as part of
 *  the author's official duties as a United States Government employee and
 *  thus cannot be copyrighted.  This software/database is freely available
 *  to the public for use. The National Library of Medicine and the U.S.
 *  Government have not placed any restriction on its use or reproduction.
 *
 *  Although all reasonable efforts have been taken to ensure the accuracy
 *  and reliability of the software and data, the NLM and the U.S.
 *  Government do not and cannot warrant the performance or results that
 *  may be obtained by using this software or data. The NLM and the U.S.
 *  Government disclaim all warranties, express or implied, including
 *  warranties of performance, merchantability or fitness for any particular
 *  purpose.
 *
 *  Please cite the author in any work or product based on this material.
 *
 * ===========================================================================
 *
 * Authors: 
 *
 * File Description:
 *
 */

Ext.namespace('Ext.ux.dd');

Ext.ux.dd.GridDragDropRowOrder = Ext.extend(Ext.util.Observable,
{
    copy: false,

    scrollable: false,

    constructor : function(config) {
        if (config)
            Ext.apply(this, config);

        this.addEvents({
            beforerowmove: true,
            afterrowmove: true,
            beforerowcopy: true,
            afterrowcopy: true,
            startDrag: true,
            endDrag: true
        });

       Ext.ux.dd.GridDragDropRowOrder.superclass.constructor.call(this);
    },

    init : function(grid) {
        this.grid = grid;
        grid.enableDragDrop = true;

        grid.on({
            render: { fn: this.onGridRender, scope: this, single: true }
        });
    },

    onGridRender : function (grid)  {
        var self = this;

        this.target = new Ext.dd.DropTarget(grid.getEl(), {
            ddGroup: grid.ddGroup || 'GridDD',
            grid: grid,
            gridDropTarget: this,
            
            notifyEnter : function(dd, e, data){
                this.gridDropTarget.fireEvent('startDrag', this.gridDropTarget);
            },
            notifyDrop: function(dd, e, data) {
                // Remove drag lines. The 'if' condition prevents null error when drop occurs without dragging out of the selection area
                if (this.currentRowEl) {
                    this.currentRowEl.removeClass('grid-row-insert-below');
                    this.currentRowEl.removeClass('grid-row-insert-above');
                }

                // determine the row
                var t = Ext.lib.Event.getTarget(e);
                var rindex = this.grid.getView().findRowIndex(t);
                if (rindex === false || rindex == data.rowIndex) {
                    this.gridDropTarget.fireEvent('endDrag', this.gridDropTarget);
                    return false;
                }
                // fire the before move/copy event
                if (this.gridDropTarget.fireEvent(self.copy ? 'beforerowcopy' : 'beforerowmove', this.gridDropTarget, data.rowIndex, rindex, data.selections, 123) === false)  {
                    this.gridDropTarget.fireEvent('endDrag', this.gridDropTarget);
                    return false;
                }

                // update the store
                var ds = this.grid.getStore();

                // Changes for multiselction by Spirit
                var selections = new Array();
                var keys = ds.data.keys;
                for (var key in keys) {
                    for (var i = 0; i < data.selections.length; i++) {
                        if (keys[key] == data.selections[i].id) {
                            // Exit to prevent drop of selected records on itself.
                            if (rindex == key) {
                                this.gridDropTarget.fireEvent('endDrag', this.gridDropTarget);
                                return false;
                            }
                            selections.push(data.selections[i]);
                        }
                    }
                }

                // fix rowindex based on before/after move
                if (rindex > data.rowIndex && this.rowPosition < 0) {
                    rindex--;
                }
                if (rindex < data.rowIndex && this.rowPosition > 0) {
                    rindex++;
                }

                // fix rowindex for multiselection
                if (rindex > data.rowIndex && data.selections.length > 1) {
                    rindex = rindex - (data.selections.length - 1);
                }

                // we tried to move this node before the next sibling, we stay in place
                if (rindex == data.rowIndex) {
                    this.gridDropTarget.fireEvent('endDrag', this.gridDropTarget);               
                    return false;
                }

                // fire the before move/copy event
                /* dupe - does it belong here or above???
                if (this.gridDropTarget.fireEvent(self.copy ? 'beforerowcopy' : 'beforerowmove', this.gridDropTarget, data.rowIndex, rindex, data.selections, 123) === false)  {
                    return false;
                }
                */

                if (!self.copy) {
                    for (var i = 0; i < data.selections.length; i++)  {
                        ds.remove(ds.getById(data.selections[i].id));
                    }
                }

                for (var i = selections.length - 1; i >= 0; i--) {
                    var insertIndex = rindex;
                    ds.insert(insertIndex, selections[i]);
                }

                // re-select the row(s)
                var sm = this.grid.getSelectionModel();
                if (sm)  {
                    sm.selectRecords(data.selections);
                }

                // fire the after move/copy event
                this.gridDropTarget.fireEvent(self.copy ? 'afterrowcopy' : 'afterrowmove', this.gridDropTarget, data.rowIndex, rindex, data.selections);
                this.gridDropTarget.fireEvent('endDrag', this.gridDropTarget);
                return true;
            },

            notifyOver: function(dd, e, data) {
                var t = Ext.lib.Event.getTarget(e);
                var rindex = this.grid.getView().findRowIndex(t);

                // Similar to the code in notifyDrop. Filters for selected rows and quits function if any one row matches the current selected row.
                var ds = this.grid.getStore();
                var keys = ds.data.keys;
                for (var key in keys) {
                    for (var i = 0; i < data.selections.length; i++) {
                        if (keys[key] == data.selections[i].id)  {
                            if (rindex == key) {
                                if (this.currentRowEl) {
                                    this.currentRowEl.removeClass('grid-row-insert-below');
                                    this.currentRowEl.removeClass('grid-row-insert-above');
                                }
                                return this.dropNotAllowed;
                            }
                        }
                    }
                }

                // If on first row, remove upper line. Prevents negative index error as a result of rindex going negative.
                if (rindex < 0 || rindex === false) {
                    this.currentRowEl.removeClass('grid-row-insert-above');
                    return this.dropNotAllowed;
                }

                try {
                    var currentRow = this.grid.getView().getRow(rindex);
                    // Find position of row relative to page (adjusting for grid's scroll position)
                    var resolvedRow = new Ext.Element(currentRow).getY() - this.grid.getView().scroller.dom.scrollTop;
                    var rowHeight = currentRow.offsetHeight;

                    // Cursor relative to a row. -ve value implies cursor is above the row's middle and +ve value implues cursor is below the row's middle.
                    this.rowPosition = e.getPageY() - resolvedRow - (rowHeight/2);

                    // Clear drag line.
                    if (this.currentRowEl) {
                        this.currentRowEl.removeClass('grid-row-insert-below');
                        this.currentRowEl.removeClass('grid-row-insert-above');
                    }

                    if (this.rowPosition > 0) {
                        // If the pointer is on the bottom half of the row.
                        this.currentRowEl = new Ext.Element(currentRow);
                        this.currentRowEl.addClass('grid-row-insert-below');
                    } else {
                        // If the pointer is on the top half of the row.
                        if (rindex - 1 >= 0) {
                            var previousRow = this.grid.getView().getRow(rindex - 1);
                            this.currentRowEl = new Ext.Element(previousRow);
                            this.currentRowEl.addClass('grid-row-insert-below');
                        } else {
                            // If the pointer is on the top half of the first row.
                            this.currentRowEl.addClass('grid-row-insert-above');
                        }
                    }
                }
                catch (err) {
                    console.warn(err);
                    rindex = false;
                }
                return (rindex === false)? this.dropNotAllowed : this.dropAllowed;
            },

            notifyOut: function(dd, e, data) {
                // Remove drag lines when pointer leaves the gridView.
                if (this.currentRowEl)  {
                    this.currentRowEl.removeClass('grid-row-insert-above');
                    this.currentRowEl.removeClass('grid-row-insert-below');
                }
            }
        });

        if (this.targetCfg)  {
            Ext.apply(this.target, this.targetCfg);
        }

        if (this.scrollable)  {
            Ext.dd.ScrollManager.register(grid.getView().getEditorParent());
            grid.on({
                beforedestroy: this.onBeforeDestroy,
                scope: this,
                single: true
            });
        }
    },

    getTarget: function()  {
        return this.target;
    },

    getGrid: function() {
        return this.grid;
    },

    getCopy: function()  {
        return this.copy ? true : false;
    },

    setCopy: function(b) {
        this.copy = b ? true : false;
    },

    onBeforeDestroy : function (grid)  {
        this.target.unreg();
        // if we previously registered with the scroll manager, unregister
        // it (if we don't it will lead to problems in IE)
        Ext.dd.ScrollManager.unregister(grid.getView().getEditorParent());
    }
});

/**
 * @class Ext.ux.tot2ivn.VrTabPanel
 * @version		0.21		Tested working with ExtJS 3.2+ on IE6+, FireFox 2+, Chrome 4+, Opera 9.6+, Safari 4+
 * @author	Anh Nguyen (Totti)
 * @description		Vertical TabPanel implements the same set of features as those of Ext.TabPanel. 
 *	Tab position defaults to 'left'. Position 'right' is not supported.
 *	Auto-scrolling currently not implemented.
 *  Three config properties users would want to config are :
	@cfg border
	@cfg tabWidth
	@cfg tabMarginTop
	See description of config properties below.
	
 * @extends Ext.Panel
 * @constructor
 * @param {Object} config The configuration options
 * @xtype tabpanel
 */

Ext.ns('Ext.ux.tot2ivn');
Ext.ux.tot2ivn.VrTabPanel = Ext.extend(Ext.Panel,  {
    /** Vertical Tab Panel cfg */
	/**
     * @cfg {Boolean} border
     * Set to true to draw the outline border of the whole panel. Defaults to true.
     */
	 border: true,
	 /**
     * @cfg {Number} tabWidth The initial width in pixels of each new tab title (defaults to 130).
     */
    tabWidth : 130,	
	/**
     * @cfg {Number} tabMarginTop The initial top margin in pixels of the tab strip. (defaults to 15).
     */
	tabMarginTop : 15,
	
	/**
     * @cfg {Boolean} layoutOnTabChange
     * Set to true to force a layout of the active tab when the tab is changed. Defaults to false.
     * See {@link Ext.layout.CardLayout}.<code>{@link Ext.layout.CardLayout#layoutOnCardChange layoutOnCardChange}</code>.
     */
    /**
     * @cfg {String} tabCls <b>This config option is used on <u>child Components</u> of ths TabPanel.</b> A CSS
     * class name applied to the tab strip item representing the child Component, allowing special
     * styling to be applied.
     */
    /**
     * @cfg {Boolean} deferredRender
     */
    deferredRender : true,    
    /**
     * @cfg {Number} minTabWidth The minimum width in pixels for each tab when {@link #resizeTabs} = true (defaults to 30).
     */
    minTabWidth : 30,
    /**
     * @cfg {Boolean} resizeTabs True to automatically resize each tab so that the tabs will completely fill the
     * tab strip (defaults to false).  Setting this to true may cause specific widths that might be set per tab to
     * be overridden in order to fit them all into view (although {@link #minTabWidth} will always be honored).
     */
    resizeTabs : false,
    /**
     * @cfg {Boolean} enableTabScroll True to enable scrolling to tabs that may be invisible due to overflowing the
     * overall TabPanel width. Only available with tabPosition:'top' (defaults to false).
     */
    enableTabScroll : false,
    /**
     * @cfg {Number} scrollIncrement The number of pixels to scroll each time a tab scroll button is pressed
     * (defaults to <tt>100</tt>, or if <tt>{@link #resizeTabs} = true</tt>, the calculated tab width).  Only
     * applies when <tt>{@link #enableTabScroll} = true</tt>.
     */
    scrollIncrement : 0,
    /**
     * @cfg {Number} scrollRepeatInterval Number of milliseconds between each scroll while a tab scroll button is
     * continuously pressed (defaults to <tt>400</tt>).
     */
    scrollRepeatInterval : 400,
    /**
     * @cfg {Float} scrollDuration The number of milliseconds that each scroll animation should last (defaults
     * to <tt>.35</tt>). Only applies when <tt>{@link #animScroll} = true</tt>.
     */
    scrollDuration : 0.35,
    /**
     * @cfg {Boolean} animScroll True to animate tab scrolling so that hidden tabs slide smoothly into view (defaults
     * to <tt>true</tt>).  Only applies when <tt>{@link #enableTabScroll} = true</tt>.
     */
    animScroll : true,
    /**
	 * @hide
     * @cfg {String} tabPosition The position where the tab strip should be rendered (defaults to <tt>'left'</tt>).
     * No other value supported.  <b>Note</b>: tab scrolling is currently not supported.
     * <tt>tabPosition: 'top'</tt>. Config property internally remained 'top' to reuse Ext.TabPanel styles.
     */
    tabPosition : 'top',
    
	/**
     * @cfg {String} baseCls The base CSS class applied to the panel (defaults to <tt>'x-tab-panel'</tt>).
     */
    baseCls : 'x-tab-panel x-tot2ivn-vr-tab-panel',
    
	/**
     * @cfg {Boolean} autoTabs
     */
    autoTabs : false,
    /**
     * @cfg {String} autoTabSelector The CSS selector used to search for tabs in existing markup when
     * <tt>{@link #autoTabs} = true</tt> (defaults to <tt>'div.x-tab'</tt>).  This can be any valid selector
     * supported by {@link Ext.DomQuery#select}. Note that the query will be executed within the scope of this
     * tab panel only (so that multiple tab panels from markup can be supported on a page).
     */
    autoTabSelector : 'div.x-tab',
    /**
     * @cfg {String/Number} activeTab A string id or the numeric index of the tab that should be initially
     * activated on render (defaults to undefined).
     */
    activeTab : undefined,
    /**
     * @cfg {Number} tabMargin The number of pixels of space to calculate into the sizing and scrolling of
     * tabs. If you change the margin in CSS, you will need to update this value so calculations are correct
     * with either <tt>{@link #resizeTabs}</tt> or scrolling tabs. (defaults to <tt>2</tt>)
     */
    tabMargin : 2,
    /**
     * @cfg {Boolean} plain </tt>true</tt> to render the tab strip without a background container image
     * (defaults to <tt>false</tt>).
     */
    plain : false,
    /**
     * @cfg {Number} wheelIncrement For scrolling tabs, the number of pixels to increment on mouse wheel
     * scrolling (defaults to <tt>20</tt>).
     */
    wheelIncrement : 20,

    /*
     * This is a protected property used when concatenating tab ids to the TabPanel id for internal uniqueness.
     * It does not generally need to be changed, but can be if external code also uses an id scheme that can
     * potentially clash with this one.
     */
    idDelimiter : '__',

    // private
    itemCls : 'x-tab-item',

    // private config overrides
    elements : 'body',
    headerAsText : false,
    frame : false,
    hideBorders :true,

    // private
    initComponent : function(){
        this.frame = false;
        Ext.ux.tot2ivn.VrTabPanel.superclass.initComponent.call(this);
		
		// Add border
		if (this.border) {
			this.style = 'border: 1px solid #99BBE8; ' + this.style;
		}
		
        this.addEvents(
            /**
             * @event beforetabchange
             * Fires before the active tab changes. Handlers can <tt>return false</tt> to cancel the tab change.
             * @param {TabPanel} this
             * @param {Panel} newTab The tab being activated
             * @param {Panel} currentTab The current active tab
             */
            'beforetabchange',
            /**
             * @event tabchange
             * Fires after the active tab has changed.
             * @param {TabPanel} this
             * @param {Panel} tab The new active tab
             */
            'tabchange',
            /**
             * @event contextmenu
             * Relays the contextmenu event from a tab selector element in the tab strip.
             * @param {TabPanel} this
             * @param {Panel} tab The target tab
             * @param {EventObject} e
             */
            'contextmenu'
        );
        /**
         * @cfg {Object} layoutConfig
         * TabPanel implicitly uses {@link Ext.layout.CardLayout} as its layout manager.
         * <code>layoutConfig</code> may be used to configure this layout manager.
         * <code>{@link #deferredRender}</code> and <code>{@link #layoutOnTabChange}</code>
         * configured on the TabPanel will be applied as configs to the layout manager.
         */
        this.setLayout(new Ext.layout.CardLayout(Ext.apply({
            layoutOnCardChange: this.layoutOnTabChange,
            deferredRender: this.deferredRender
        }, this.layoutConfig)));

        if(this.tabPosition == 'top'){
            this.elements += ',header';
            this.stripTarget = 'header';
        }else {
            this.elements += ',footer';
            this.stripTarget = 'footer';
        }
        if(!this.stack){
            this.stack = Ext.ux.tot2ivn.VrTabPanel.AccessStack();
        }
        this.initItems();
    },

    // private
    onRender : function(ct, position){
        Ext.ux.tot2ivn.VrTabPanel.superclass.onRender.call(this, ct, position);

        if(this.plain){
            var pos = this.tabPosition == 'top' ? 'header' : 'footer';
            this[pos].addClass('x-tab-panel-'+pos+'-plain');
        }

        var st = this[this.stripTarget];

        this.stripWrap = st.createChild({cls:'x-tab-strip-wrap x-tot2ivn-vr-tab-strip-wrap', cn:{
            style: 'margin-top: ' + this.tabMarginTop + 'px;',
			tag:'ul', cls:'x-tab-strip x-tot2ivn-vr-tab-strip x-tab-strip-'+this.tabPosition + ' x-tot2ivn-vr-tab-strip-' + this.tabPosition}});

        var beforeEl = (this.tabPosition=='bottom' ? this.stripWrap : null);
        st.createChild({cls:'x-tab-strip-spacer x-tot2ivn-vr-tab-strip-spacer'}, beforeEl);
        this.strip = new Ext.Element(this.stripWrap.dom.firstChild);

        // create an empty span with class x-tab-strip-text to force the height of the header element when there's no tabs.        
        this.strip.createChild({cls:'x-clear'});

        this.body.addClass('x-tab-panel-body-'+this.tabPosition);

        /**
         * @cfg {Template/XTemplate} itemTpl <p>(Optional) A {@link Ext.Template Template} or
         */
        if(!this.itemTpl){
            var tt = new Ext.Template(
                 '<li class="{cls} x-tot2ivn-vr-tab-strip-title" id="{id}"><a class="x-tab-strip-close"></a>',
                 '<a class="x-tab-right" href="#"><em class="x-tab-left">',
                 '<span class="x-tab-strip-inner"><span class="x-tab-strip-text x-tot2ivn-vr-tab-strip-text {iconCls}">{text}</span></span>',
                 '</em></a></li>'
            );
            tt.disableFormats = true;
            tt.compile();
            Ext.ux.tot2ivn.VrTabPanel.prototype.itemTpl = tt;
        }

        this.items.each(this.initTab, this);
    },

    // private
    afterRender : function(){
        Ext.ux.tot2ivn.VrTabPanel.superclass.afterRender.call(this);
        if(this.autoTabs){
            this.readTabs(false);
        }
        if(this.activeTab !== undefined){
            var item = Ext.isObject(this.activeTab) ? this.activeTab : this.items.get(this.activeTab);
            delete this.activeTab;
            this.setActiveTab(item);
        }
    },

    // private
    initEvents : function(){
        Ext.ux.tot2ivn.VrTabPanel.superclass.initEvents.call(this);
        this.mon(this.strip, {
            scope: this,
            mousedown: this.onStripMouseDown,
            contextmenu: this.onStripContextMenu
        });
        if(this.enableTabScroll){
            this.mon(this.strip, 'mousewheel', this.onWheel, this);
        }
    },

    // private
    findTargets : function(e){
        var item = null,
            itemEl = e.getTarget('li:not(.x-tab-edge)', this.strip);

        if(itemEl){
            item = this.getComponent(itemEl.id.split(this.idDelimiter)[1]);
            if(item.disabled){
                return {
                    close : null,
                    item : null,
                    el : null
                };
            }
        }
        return {
            close : e.getTarget('.x-tab-strip-close', this.strip),
            item : item,
            el : itemEl
        };
    },

    // private
    onStripMouseDown : function(e){
        if(e.button !== 0){
            return;
        }
        e.preventDefault();
        var t = this.findTargets(e);
        if(t.close){
            if (t.item.fireEvent('beforeclose', t.item) !== false) {
                t.item.fireEvent('close', t.item);
                this.remove(t.item);
            }
            return;
        }
        if(t.item && t.item != this.activeTab){
            this.setActiveTab(t.item);
        }
    },

    // private
    onStripContextMenu : function(e){
        e.preventDefault();
        var t = this.findTargets(e);
        if(t.item){
            this.fireEvent('contextmenu', this, t.item, e);
        }
    },

    /**
     * True to scan the markup in this tab panel for <tt>{@link #autoTabs}</tt> using the
     * <tt>{@link #autoTabSelector}</tt>
     * @param {Boolean} removeExisting True to remove existing tabs
     */
    readTabs : function(removeExisting){
        if(removeExisting === true){
            this.items.each(function(item){
                this.remove(item);
            }, this);
        }
        var tabs = this.el.query(this.autoTabSelector);
        for(var i = 0, len = tabs.length; i < len; i++){
            var tab = tabs[i],
                title = tab.getAttribute('title');
            tab.removeAttribute('title');
            this.add({
                title: title,
                contentEl: tab
            });
        }
    },

    // private
    initTab : function(item, index){
        var before = this.strip.dom.childNodes[index],
            p = this.getTemplateArgs(item),
            el = before ?
                 this.itemTpl.insertBefore(before, p) :
                 this.itemTpl.append(this.strip, p),
            cls = 'x-tab-strip-over',
            tabEl = Ext.get(el);

        tabEl.hover(function(){
            if(!item.disabled){
                tabEl.addClass(cls);
            }
        }, function(){
            tabEl.removeClass(cls);
        });

        if(item.tabTip){
            tabEl.child('span.x-tab-strip-text', true).qtip = item.tabTip;
        }
        item.tabEl = el;

        // Route *keyboard triggered* click events to the tab strip mouse handler.
        tabEl.select('a').on('click', function(e){
            if(!e.getPageX()){                
				this.onStripMouseDown(e);				
            }
        }, this, {preventDefault: true});

        item.on({
            scope: this,
            disable: this.onItemDisabled,
            enable: this.onItemEnabled,
            titlechange: this.onItemTitleChanged,
            iconchange: this.onItemIconChanged,
            beforeshow: this.onBeforeShowItem
        });
    },



    /**
     * <p>Provides template arguments for rendering a tab selector item in the tab strip.</p>
     * <p>This method returns an object hash containing properties used by the TabPanel's <tt>{@link #itemTpl}</tt>
     * to create a formatted, clickable tab selector element. The properties which must be returned
     * are:</p><div class="mdetail-params"><ul>
     * <li><b>id</b> : String<div class="sub-desc">A unique identifier which links to the item</div></li>
     * <li><b>text</b> : String<div class="sub-desc">The text to display</div></li>
     * <li><b>cls</b> : String<div class="sub-desc">The CSS class name</div></li>
     * <li><b>iconCls</b> : String<div class="sub-desc">A CSS class to provide appearance for an icon.</div></li>
     * </ul></div>
     * @param {BoxComponent} item The {@link Ext.BoxComponent BoxComponent} for which to create a selector element in the tab strip.
     * @return {Object} An object hash containing the properties required to render the selector element.
     */
    getTemplateArgs : function(item) {
        var cls = item.closable ? 'x-tab-strip-closable' : '';
        if(item.disabled){
            cls += ' x-item-disabled';
        }
        if(item.iconCls){
            cls += ' x-tab-with-icon';
        }
        if(item.tabCls){
            cls += ' ' + item.tabCls;
        }

        return {
            id: this.id + this.idDelimiter + item.getItemId(),
            text: item.title,
            cls: cls,
            iconCls: item.iconCls || ''
        };
    },

    // private
    onAdd : function(c){
        Ext.ux.tot2ivn.VrTabPanel.superclass.onAdd.call(this, c);
        if(this.rendered){
            var items = this.items;
            this.initTab(c, items.indexOf(c));
            if(items.getCount() == 1){
                this.syncSize();
            }
            this.delegateUpdates();
        }
    },

    // private
    onBeforeAdd : function(item){
        var existing = item.events ? (this.items.containsKey(item.getItemId()) ? item : null) : this.items.get(item);
        if(existing){
            this.setActiveTab(item);
            return false;
        }
        Ext.ux.tot2ivn.VrTabPanel.superclass.onBeforeAdd.apply(this, arguments);
        var es = item.elements;
        item.elements = es ? es.replace(',header', '') : es;
        item.border = (item.border === true);
    },

    // private
    onRemove : function(c){
        var te = Ext.get(c.tabEl);
        // check if the tabEl exists, it won't if the tab isn't rendered
        if(te){
            te.select('a').removeAllListeners();
            Ext.destroy(te);
        }
        Ext.ux.tot2ivn.VrTabPanel.superclass.onRemove.call(this, c);
        this.stack.remove(c);
        delete c.tabEl;
        c.un('disable', this.onItemDisabled, this);
        c.un('enable', this.onItemEnabled, this);
        c.un('titlechange', this.onItemTitleChanged, this);
        c.un('iconchange', this.onItemIconChanged, this);
        c.un('beforeshow', this.onBeforeShowItem, this);
        if(c == this.activeTab){
            var next = this.stack.next();
            if(next){
                this.setActiveTab(next);
            }else if(this.items.getCount() > 0){
                this.setActiveTab(0);
            }else{
                this.setActiveTab(null);
            }
        }
        if(!this.destroying){
            this.delegateUpdates();
        }
    },

    // private
    onBeforeShowItem : function(item){
        if(item != this.activeTab){
            this.setActiveTab(item);
            return false;
        }
    },

    // private
    onItemDisabled : function(item){
        var el = this.getTabEl(item);
        if(el){
            Ext.fly(el).addClass('x-item-disabled');
        }
        this.stack.remove(item);
    },

    // private
    onItemEnabled : function(item){
        var el = this.getTabEl(item);
        if(el){
            Ext.fly(el).removeClass('x-item-disabled');
        }
    },

    // private
    onItemTitleChanged : function(item){
        var el = this.getTabEl(item);
        if(el){
            Ext.fly(el).child('span.x-tab-strip-text', true).innerHTML = item.title;
        }
    },

    //private
    onItemIconChanged : function(item, iconCls, oldCls){
        var el = this.getTabEl(item);
        if(el){
            el = Ext.get(el);
            el.child('span.x-tab-strip-text').replaceClass(oldCls, iconCls);
            el[Ext.isEmpty(iconCls) ? 'removeClass' : 'addClass']('x-tab-with-icon');
        }
    },

    /**
     * Gets the DOM element for the tab strip item which activates the child panel with the specified
     * ID. Access this to change the visual treatment of the item, for example by changing the CSS class name.
     * @param {Panel/Number/String} tab The tab component, or the tab's index, or the tabs id or itemId.
     * @return {HTMLElement} The DOM node
     */
    getTabEl : function(item){
        var c = this.getComponent(item);
        return c ? c.tabEl : null;
    },

    // private
    onResize : function(){
        this.header.setStyle('display', 'none');
		Ext.ux.tot2ivn.VrTabPanel.superclass.onResize.apply(this, arguments);
		this.header.setStyle('display', 'block');
        this.delegateUpdates();
    },

    /**
     * Suspends any internal calculations or scrolling while doing a bulk operation. See {@link #endUpdate}
     */
    beginUpdate : function(){
        this.suspendUpdates = true;
    },

    /**
     * Resumes calculations and scrolling at the end of a bulk operation. See {@link #beginUpdate}
     */
    endUpdate : function(){
        this.suspendUpdates = false;
        this.delegateUpdates();
    },

    /**
     * Hides the tab strip item for the passed tab
     * @param {Number/String/Panel} item The tab index, id or item
     */
    hideTabStripItem : function(item){
        item = this.getComponent(item);
        var el = this.getTabEl(item);
        if(el){
            el.style.display = 'none';
            this.delegateUpdates();
        }
        this.stack.remove(item);
    },

    /**
     * Unhides the tab strip item for the passed tab
     * @param {Number/String/Panel} item The tab index, id or item
     */
    unhideTabStripItem : function(item){
        item = this.getComponent(item);
        var el = this.getTabEl(item);
        if(el){
            el.style.display = '';
            this.delegateUpdates();
        }
    },

    // private
    delegateUpdates : function(){
        if(this.suspendUpdates){
            return;
        }
        if(this.resizeTabs && this.rendered){
            // this.autoSizeTabs();
        }
        if(this.enableTabScroll && this.rendered){
            // this.autoScrollTabs();
			// TODO
        }
		
		this.adjustBodySize();
    },

	adjustBodySize : function() {
		// Header
		var tw = this.tabWidth;			
		
		if (Ext.isNumber(tw)) {						
			var bd = this.body,
				bw = bd.getWidth(),
				pw = bw - tw;			

			this.adjustBodyWidth(tw);
			
			// Set left panel width
			if (pw) {
				bd.setWidth(pw);
			}
		}
		
		this.doLayout();
	},		

	
    // private
    autoSizeTabs : function(){
        var count = this.items.length,
            ce = this.tabPosition != 'bottom' ? 'header' : 'footer',
            ow = this[ce].dom.offsetWidth,
            aw = this[ce].dom.clientWidth;

        if(!this.resizeTabs || count < 1 || !aw){ // !aw for display:none
            return;
        }

        var each = Math.max(Math.min(Math.floor((aw-4) / count) - this.tabMargin, this.tabWidth), this.minTabWidth); // -4 for float errors in IE
        this.lastTabWidth = each;
        var lis = this.strip.query('li:not(.x-tab-edge)');
        for(var i = 0, len = lis.length; i < len; i++) {
            var li = lis[i],
                inner = Ext.fly(li).child('.x-tab-strip-inner', true),
                tw = li.offsetWidth,
                iw = inner.offsetWidth;
            inner.style.width = (each - (tw-iw)) + 'px';
        }
    },

    // private
    adjustBodyWidth : function(w){
        if(this.header){
            this.header.setWidth(w);
        }
        if(this.footer){
            this.footer.setWidth(w);
        }
        return w;
    },

    /**
     * Sets the specified tab as the active tab. This method fires the {@link #beforetabchange} event which
     * can <tt>return false</tt> to cancel the tab change.
     * @param {String/Number} item
     * The id or tab Panel to activate. This parameter may be any of the following:
     * <div><ul class="mdetail-params">
     * <li>a <b><tt>String</tt></b> : representing the <code>{@link Ext.Component#itemId itemId}</code>
     * or <code>{@link Ext.Component#id id}</code> of the child component </li>
     * <li>a <b><tt>Number</tt></b> : representing the position of the child component
     * within the <code>{@link Ext.Container#items items}</code> <b>property</b></li>
     * </ul></div>
     * <p>For additional information see {@link Ext.util.MixedCollection#get}.
     */
    setActiveTab : function(item){
        item = this.getComponent(item);
        if(this.fireEvent('beforetabchange', this, item, this.activeTab) === false){
            return;
        }
        if(!this.rendered){
            this.activeTab = item;
            return;
        }
        if(this.activeTab != item){
            if(this.activeTab){
                var oldEl = this.getTabEl(this.activeTab);
                if(oldEl){
                    Ext.fly(oldEl).removeClass('x-tab-strip-active');
                }
            }
            if(item){
                var el = this.getTabEl(item);
                Ext.fly(el).addClass('x-tab-strip-active');
                this.activeTab = item;
                this.stack.add(item);

                this.layout.setActiveItem(item);
                if(this.scrolling){
                    this.scrollToTab(item, this.animScroll);
                }
            }
			
            this.fireEvent('tabchange', this, item);
        }
    },

    /**
     * Returns the Component which is the currently active tab. <b>Note that before the TabPanel
     * first activates a child Component, this method will return whatever was configured in the
     * {@link #activeTab} config option.</b>
     * @return {BoxComponent} The currently active child Component if one <i>is</i> active, or the {@link #activeTab} config value.
     */
    getActiveTab : function(){
        return this.activeTab || null;
    },

    /**
     * Gets the specified tab by id.
     * @param {String} id The tab id
     * @return {Panel} The tab
     */
    getItem : function(item){
        return this.getComponent(item);
    },

    // private
    autoScrollTabs : function(){
        this.pos = this.tabPosition=='bottom' ? this.footer : this.header;
        var count = this.items.length,
            ow = this.pos.dom.offsetHeight,
            tw = this.pos.dom.clientHeight,
            wrap = this.stripWrap,
            wd = wrap.dom,
            cw = wd.offsetHeight,
            pos = this.getScrollPos(),
            l = cw + pos + 10;

        if(!this.enableTabScroll || count < 1 || cw < 20){ // 20 to prevent display:none issues
            return;
        }
        if(l <= tw){
            wd.scrollTop = 0;
            wrap.setHeight(tw);
            if(this.scrolling){
                this.scrolling = false;
                this.pos.removeClass('x-tab-scrolling');
                this.scrollTop.hide();
                this.scrollBottom.hide();
                // See here: http://extjs.com/forum/showthread.php?t=49308&highlight=isSafari
                if(Ext.isAir || Ext.isWebKit){
                    // wd.style.marginTop = '';
                    // wd.style.marginBottom = '';
                }
            }
        }else{
            if(!this.scrolling){
                this.pos.addClass('x-tab-scrolling');
                // See here: http://extjs.com/forum/showthread.php?t=49308&highlight=isSafari
                if(Ext.isAir || Ext.isWebKit){
                    // wd.style.marginTop = '18px';
                    // wd.style.marginBottom = '18px';
                }
            }
            tw -= wrap.getMargins('tb');
            wrap.setHeight(tw > 20 ? tw : 20);
            if(!this.scrolling){
                if(!this.scrollTop){
                    this.createScrollers();
                }else{
                    this.scrollTop.show();
                    this.scrollBottom.show();
                }
            }
            this.scrolling = true;
            if(pos > (l-tw)){ // ensure it stays within bounds
                wd.scrollTop = l-tw;
            }else{ // otherwise, make sure the active tab is still visible
                this.scrollToTab(this.activeTab, false);
            }
            this.updateScrollButtons();
        }
    },

    // private	
    createScrollers : function(){
		
        this.header.addClass('x-tab-scrolling-' + this.tabPosition);
        var w = this.tabWidth,
			sw = this.stripWrap;
		
		// stripWrap		
		sw.setWidth(w);
		sw.applyStyles({'margin': '0'});
		
        // top
        var sl = this.header.insertFirst({
            cls:'x-tab-scroller-top'
        });
        sl.setWidth(w);
        sl.addClassOnOver('x-tab-scroller-top-over');
        this.leftRepeater = new Ext.util.ClickRepeater(sl, {
            interval : this.scrollRepeatInterval,
            handler: this.onscrollTop,
            scope: this
        });
        this.scrollTop = sl;

        // bottom
        var sr = this.stripWrap.insertSibling({
            cls:'x-tab-scroller-bottom'
        }, 'after');
        sr.setWidth(w);
        sr.addClassOnOver('x-tab-scroller-bottom-over');
        this.rightRepeater = new Ext.util.ClickRepeater(sr, {
            interval : this.scrollRepeatInterval,
            handler: this.onscrollBottom,
            scope: this
        });
        this.scrollBottom = sr;
    },

    // private
    getScrollHeight : function(){
        return this.getScrollPos();
    },

    // private
    getScrollPos : function(){
        return parseInt(this.stripWrap.dom.scrollTop, 10) || 0;
    },

    // private
    getScrollArea : function(){
        return parseInt(this.stripWrap.dom.clientHeight, 10) || 0;
    },

    // private
    getScrollAnim : function(){
        return {duration:this.scrollDuration, callback: this.updateScrollButtons, scope: this};
    },

    // private
    getScrollIncrement : function(){
        return this.scrollIncrement || (this.resizeTabs ? this.lastTabWidth+2 : 100);
    },

    /**
     * Scrolls to a particular tab if tab scrolling is enabled
     * @param {Panel} item The item to scroll to
     * @param {Boolean} animate True to enable animations
     */

    scrollToTab : function(item, animate){
        if(!item){
            return;
        }
        var el = this.getTabEl(item),
            pos = this.getScrollPos(),
            area = this.getScrollArea(),
            top = Ext.fly(el).getOffsetsTo(this.stripWrap)[0] + pos,
            bottom = top + el.offsetHeight;
        if(top < pos){
            this.scrollTo(top, animate);
        }else if(bottom > (pos + area)){
            this.scrollTo(bottom - area, animate);
        }
    },

    // private
    scrollTo : function(pos, animate){
        this.stripWrap.scrollTo('top', pos, animate ? this.getScrollAnim() : false);
        if(!animate){
            this.updateScrollButtons();
        }
    },

    onWheel : function(e){
        var d = e.getWheelDelta()*this.wheelIncrement*-1;
        e.stopEvent();

        var pos = this.getScrollPos(),
            newpos = pos + d,
            sw = this.getScrollHeight()-this.getScrollArea();

        var s = Math.max(0, Math.min(sw, newpos));
        if(s != pos){
            this.scrollTo(s, false);
        }
    },

    // private
    onscrollBottom : function(){
        var sw = this.getScrollHeight()-this.getScrollArea(),
            pos = this.getScrollPos(),
            s = Math.min(sw, pos + this.getScrollIncrement());
        if(s != pos){
            this.scrollTo(s, this.animScroll);
        }
    },

    // private
    onscrollTop : function(){
        var pos = this.getScrollPos(),
            s = Math.max(0, pos - this.getScrollIncrement());
        if(s != pos){
            this.scrollTo(s, this.animScroll);
        }
    },

    // private
    updateScrollButtons : function(){
        var pos = this.getScrollPos();
        this.scrollTop[pos === 0 ? 'addClass' : 'removeClass']('x-tab-scroller-left-disabled');
        this.scrollBottom[pos >= (this.getScrollHeight()-this.getScrollArea()) ? 'addClass' : 'removeClass']('x-tab-scroller-right-disabled');
    },

    // private
    beforeDestroy : function() {
        Ext.destroy(this.leftRepeater, this.rightRepeater);
        this.deleteMembers('strip', 'edge', 'scrollTop', 'scrollBottom', 'stripWrap');
        this.activeTab = null;
        Ext.ux.tot2ivn.VrTabPanel.superclass.beforeDestroy.apply(this);
    }

    /**
     * @cfg {Boolean} collapsible
     * @hide
     */
    /**
     * @cfg {String} header
     * @hide
     */
    /**
     * @cfg {Boolean} headerAsText
     * @hide
     */
    /**
     * @property header
     * @hide
     */
    /**
     * @cfg title
     * @hide
     */
    /**
     * @cfg {Array} tools
     * @hide
     */
    /**
     * @cfg {Array} toolTemplate
     * @hide
     */
    /**
     * @cfg {Boolean} hideCollapseTool
     * @hide
     */
    /**
     * @cfg {Boolean} titleCollapse
     * @hide
     */
    /**
     * @cfg {Boolean} collapsed
     * @hide
     */
    /**
     * @cfg {String} layout
     * @hide
     */
    /**
     * @cfg {Boolean} preventBodyReset
     * @hide
     */
});
Ext.reg('vrtabpanel', Ext.ux.tot2ivn.VrTabPanel);

/**
 * See {@link #setActiveTab}. Sets the specified tab as the active tab. This method fires
 * the {@link #beforetabchange} event which can <tt>return false</tt> to cancel the tab change.
 * @param {String/Panel} tab The id or tab Panel to activate
 * @method activate
 */
Ext.ux.tot2ivn.VrTabPanel.prototype.activate = Ext.ux.tot2ivn.VrTabPanel.prototype.setActiveTab;

// private utility class used by TabPanel
Ext.ux.tot2ivn.VrTabPanel.AccessStack = function(){
    var items = [];
    return {
        add : function(item){
            items.push(item);
            if(items.length > 10){
                items.shift();
            }
        },

        remove : function(item){
            var s = [];
            for(var i = 0, len = items.length; i < len; i++) {
                if(items[i] != item){
                    s.push(items[i]);
                }
            }
            items = s;
        },

        next : function(){
            return items.pop();
        }
    };
};
/*!
 * Ext JS Library 3.4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */
Ext.ns('Ext.ux.grid');

/**
 * @class Ext.ux.grid.CheckColumn
 * @extends Ext.grid.Column
 * <p>A Column subclass which renders a checkbox in each column cell which toggles the truthiness of the associated data field on click.</p>
 * <p><b>Note. As of ExtJS 3.3 this no longer has to be configured as a plugin of the GridPanel.</b></p>
 * <p>Example usage:</p>
 * <pre><code>
var cm = new Ext.grid.ColumnModel([{
       header: 'Foo',
       ...
    },{
       xtype: 'checkcolumn',
       header: 'Indoor?',
       dataIndex: 'indoor',
       width: 55
    }
]);

// create the grid
var grid = new Ext.grid.EditorGridPanel({
    ...
    colModel: cm,
    ...
});
 * </code></pre>
 * In addition to toggling a Boolean value within the record data, this
 * class toggles a css class between <tt>'x-grid3-check-col'</tt> and
 * <tt>'x-grid3-check-col-on'</tt> to alter the background image used for
 * a column.
 */
Ext.ux.grid.CheckColumn = Ext.extend(Ext.grid.Column, {

    /**
     * @private
     * Process and refire events routed from the GridView's processEvent method.
     */
    processEvent : function(name, e, grid, rowIndex, colIndex){
        if (['mousedown', 'click'].indexOf(name) >= 0 && !(e.ctrlKey | e.shiftKey | e.altKey)) {
            var record = grid.store.getAt(rowIndex);
            var dataIndex = this.dataIndex
            record.set(dataIndex, !record.data[dataIndex]);
            // processing selected rows added
            var ss = grid.getSelectionModel().getSelections();
            if (ss.length <= 1) return false;
            var indices = [];
            for (var i=0; i < ss.length; i++) {
                var idx = grid.store.indexOfId(ss[i].id);
                if (idx == rowIndex)
                    var checkVal = grid.store.getAt(rowIndex).data[dataIndex];
                else indices.push(idx);
            }
            if (typeof checkVal !== 'undefined') {
                indices.forEach(function(idx) {
                    grid.store.getAt(idx).set(dataIndex, checkVal);
                });
            }
            return false; // Cancel row selection.
        } else {
            return Ext.grid.ActionColumn.superclass.processEvent.apply(this, arguments);
        }
    },

    renderer : function(v, p, record){
        p.css += ' x-grid3-check-col-td'; 
        return String.format('<div class="x-grid3-check-col{0}">&#160;</div>', v ? '-on' : '');
    },

    // Deprecate use as a plugin. Remove in 4.0
    init: Ext.emptyFn
});

// register ptype. Deprecate. Remove in 4.0
Ext.preg('checkcolumn', Ext.ux.grid.CheckColumn);

// backwards compat. Remove in 4.0
Ext.grid.CheckColumn = Ext.ux.grid.CheckColumn;

// register Column xtype
Ext.grid.Column.types.checkcolumn = Ext.ux.grid.CheckColumn;/*!
 * Ext JS Library 3.4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */
Ext.ns('Ext.ux.form');

Ext.ux.form.SearchField = Ext.extend(Ext.form.TwinTriggerField, {
    initComponent : function(){
        Ext.ux.form.SearchField.superclass.initComponent.call(this);
        this.on('specialkey', function(f, e){
            if(e.getKey() == e.ENTER){
                this.onTrigger2Click();
            }
        }, this);
    },

    validationEvent:false,
    validateOnBlur:false,
    trigger1Class:'x-form-clear-trigger',
    trigger2Class:'x-form-search-trigger',
    hideTrigger1:true,
    width:180,
    hasSearch : false,
    paramName : 'query',

    onTrigger1Click : function(){
        if(this.hasSearch){
            this.el.dom.value = '';
            var o = {start: 0};
            this.store.baseParams = this.store.baseParams || {};
            this.store.baseParams[this.paramName] = '';
            this.store.reload({params:o});
            this.triggers[0].hide();
            this.hasSearch = false;
        }
    },

    onTrigger2Click : function(){
        var v = this.getRawValue();
        if(v.length < 1){
            this.onTrigger1Click();
            return;
        }
        var o = {start: 0};
        this.store.baseParams = this.store.baseParams || {};
        this.store.baseParams[this.paramName] = v;
        this.store.reload({params:o});
        this.hasSearch = true;
        this.triggers[0].show();
    }
});/*  $Id: globals.js 34117 2015-11-05 18:20:29Z borodine $
 * ===========================================================================
 *
 *                            PUBLIC DOMAIN NOTICE
 *               National Center for Biotechnology Information
 *
 *  This software/database is a "United States Government Work" under the
 *  terms of the United States Copyright Act.  It was written as part of
 *  the author's official duties as a United States Government employee and
 *  thus cannot be copyrighted.  This software/database is freely available
 *  to the public for use. The National Library of Medicine and the U.S.
 *  Government have not placed any restriction on its use or reproduction.
 *
 *  Although all reasonable efforts have been taken to ensure the accuracy
 *  and reliability of the software and data, the NLM and the U.S.
 *  Government do not and cannot warrant the performance or results that
 *  may be obtained by using this software or data. The NLM and the U.S.
 *  Government disclaim all warranties, express or implied, including
 *  warranties of performance, merchantability or fitness for any particular
 *  purpose.
 *
 *  Please cite the author in any work or product based on this material.
 *
 * ===========================================================================
 *
 * Authors:  Maxim Didenko
 *
 * File Description:
 *
 */

 // Decorate long numbers with commas
Number.prototype.commify = function() {
    nStr = this + '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
};

Number.prototype.shorten = function() {

    var value = this.valueOf();
    var negv = ( value < 0 );
    if( negv ) value = -value;

    var Suffixes = [ '', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y' ];

    var sfx = '';
    for( var i = 0; i < Suffixes.length; i++ ){
        if( value < 1000 ){
            sfx = Suffixes[i];
            break;
        }

        value /= 1000;
    }

    return ( negv ? '-' : '' ) + Number( value ).toFixed( value < 10 && sfx != '' ? 1 : 0 ) + sfx;
};
/*
// fix for IE9 it may need to be removed when this fix in in ExtJS
if ((typeof Range !== "undefined") && !Range.prototype.createContextualFragment)
{
    Range.prototype.createContextualFragment = function(html)
    {
        var frag = document.createDocumentFragment(),
        div = document.createElement("div");
        frag.appendChild(div);
        div.outerHTML = html;
        return frag;
    };
}
*/
/* Cross-Browser Split 1.0.1
(c) Steven Levithan <stevenlevithan.com>; MIT License
An ECMA-compliant, uniform cross-browser split method */

var cbSplit;

// avoid running twice, which would break `cbSplit._nativeSplit`'s reference to the native `split`
if (!cbSplit) {

cbSplit = function (str, separator, limit) {
    // if `separator` is not a regex, use the native `split`
    if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
        return cbSplit._nativeSplit.call(str, separator, limit);
    }

    var output = [],
        lastLastIndex = 0,
        flags = (separator.ignoreCase ? "i" : "") +
                (separator.multiline  ? "m" : "") +
                (separator.sticky     ? "y" : ""),
        separator = RegExp(separator.source, flags + "g"), // make `global` and avoid `lastIndex` issues by working with a copy
        separator2, match, lastIndex, lastLength;

    str = str + ""; // type conversion
    if (!cbSplit._compliantExecNpcg) {
        separator2 = RegExp("^" + separator.source + "$(?!\\s)", flags); // doesn't need /g or /y, but they don't hurt
    }

    /* behavior for `limit`: if it's...
    - `undefined`: no limit.
    - `NaN` or zero: return an empty array.
    - a positive number: use `Math.floor(limit)`.
    - a negative number: no limit.
    - other: type-convert, then use the above rules. */
    if (limit === undefined || +limit < 0) {
        limit = Infinity;
    } else {
        limit = Math.floor(+limit);
        if (!limit) {
            return [];
        }
    }

    while (match = separator.exec(str)) {
        lastIndex = match.index + match[0].length; // `separator.lastIndex` is not reliable cross-browser

        if (lastIndex > lastLastIndex) {
            output.push(str.slice(lastLastIndex, match.index));

            // fix browsers whose `exec` methods don't consistently return `undefined` for nonparticipating capturing groups
            if (!cbSplit._compliantExecNpcg && match.length > 1) {
                match[0].replace(separator2, function () {
                    for (var i = 1; i < arguments.length - 2; i++) {
                        if (arguments[i] === undefined) {
                            match[i] = undefined;
                        }
                    }
                });
            }

            if (match.length > 1 && match.index < str.length) {
                Array.prototype.push.apply(output, match.slice(1));
            }

            lastLength = match[0].length;
            lastLastIndex = lastIndex;

            if (output.length >= limit) {
                break;
            }
        }

        if (separator.lastIndex === match.index) {
            separator.lastIndex++; // avoid an infinite loop
        }
    }

    if (lastLastIndex === str.length) {
        if (lastLength || !separator.test("")) {
            output.push("");
        }
    } else {
        output.push(str.slice(lastLastIndex));
    }

    return output.length > limit ? output.slice(0, limit) : output;
};

cbSplit._compliantExecNpcg = /()??/.exec("")[1] === undefined; // NPCG: nonparticipating capturing group
cbSplit._nativeSplit = String.prototype.split;

} // end `if (!cbSplit)`

// for convenience... interferes with Ext.js interpretation of split, sorry
//String.prototype.split = function (separator, limit) {
//    return cbSplit(this, separator, limit);
//};
// End of Cross-Browser Split



String.prototype.trimToPix = function(length) {
    var tmp = this;
    var trimmed = this;
    if (tmp.visualLength() > length)  {
        trimmed += "...";
        while (trimmed.visualLength() > length)  {
            tmp = tmp.substring(0, tmp.length-1);
            trimmed = tmp + "...";
        }
    }
    return trimmed;
};
String.prototype.trim = function () {
    return this.replace(/^\s*/, "").replace(/\s*$/, "");
};

Ext.QuickTips.init();
Ext.form.Field.prototype.msgTarget = 'title';

Ext.namespace('Ext.ux');

/**
 * Clone Function
 */
Ext.ux.clone = function(o) {
    if(!o || 'object' !== typeof o) {
        return o;
    }
    if('function' === typeof o.clone) {
        return o.clone();
    }
    var c = '[object Array]' === Object.prototype.toString.call(o) ? [] : {};
    var p, v;
    for(p in o) {
        if(o.hasOwnProperty(p)) {
            v = o[p];
            if(v && 'object' === typeof v) {
                c[p] = Ext.ux.clone(v);
            }
            else {
                c[p] = v;
            }
        }
    }
    return c;
}; // eo function clone

Ext.ux.AreObjectsEqual = function(obj1, obj2) {
    var json1 = Ext.util.JSON.encode(obj1);
    var json2 = Ext.util.JSON.encode(obj2);
    return json1 == json2;
};

Ext.lib.Event.resolveTextNode = Ext.isGecko ? function(node){
    if(!node){
        return;
    }
    var s = HTMLElement.prototype.toString.call(node);
    if(s == '[xpconnect wrapped native prototype]' || s == '[object XULElement]'){
        return;
    }
    return node.nodeType == 3 ? node.parentNode : node;
} : function(node){
    return node && node.nodeType == 3 ? node.parentNode : node;
};

Ext.namespace('Ext.ux.plugin');

Ext.ux.plugin.triggerfieldTooltip = function(config){
    Ext.apply(this, config);
};

Ext.extend(Ext.ux.plugin.triggerfieldTooltip, Ext.util.Observable,{
    init: function(component){
        this.component = component;
        this.component.on('render', this.onRender, this);
        this.component.initList = this.component.initList.createSequence(function() {
            var items = this.innerList.dom.children;
            for (var i = 0; i < items.length; ++i) {
                Ext.QuickTips.register(Ext.apply({
                      target: items[i]
                }, this.getItemToolTip(i) ));
            }
        },this.component);
    },

    //private
    onRender: function(){
        if(this.component.tooltip){
            if(typeof this.component.tooltip == 'object'){
                Ext.QuickTips.register(Ext.apply({
                      target: this.component.el
                }, this.component.tooltip));
                if (this.component.label && this.component.label.dom) {
                    Ext.QuickTips.register(Ext.apply({
                          target: this.component.label.dom
                    }, this.component.tooltip));
                }
            } else {
                this.component.trigger.dom[this.component.tooltipType] = this.component.tooltip;
            }
        }
    }
});



Ext.ux.StickyToolTipsMgr = function() {
    var list = {};
    var accessList = [];
    var front = null;
    // private
    var sortWindows = function(d1, d2){
        return (!d1._lastAccess || d1._lastAccess < d2._lastAccess) ? -1 : 1;
    };

    // private
    var orderWindows = function(){
        var a = accessList, len = a.length;
        if(len > 0){
            a.sort(sortWindows);
            var seed = a[0].manager.zseed;
            for(var i = 0; i < len; i++){
                var win = a[i];
                if(win && !win.hidden){
                    win.getEl().setZIndex(seed + (i*10));
                }
            }
        }
    };

    return {
        /**
         * The starting z-index for windows (defaults to 9000)
         * @type Number The z-index value
         */
        zseed : 7000,

        // private
        register : function(win){
            if (list[win.id]) return;
            list[win.id] = win;
            accessList.push(win);
        },
        clear : function(){
            Ext.each(accessList, function(win) {
                delete list[win.id];
                win.destroy();
                win.remove();
            });
            accessList = [];
            list = {};
            front = null;
        },

        // private
        unregister : function(win){
            delete list[win.id];
            accessList.remove(win);
        },

        /**
         * Gets a registered window by id.
         * @param {String/Object} id The id of the window or a {@link Ext.Window} instance
         * @return {Ext.Window}
         */
        get : function(id){
            return typeof id == "object" ? id : list[id];
        },

        /**
         * Brings the specified window to the front of any other active windows.
         * @param {String/Object} win The id of the window or a {@link Ext.Window} instance
         * @return {Boolean} True if the dialog was brought to the front, else false
         * if it was already in front
         */
        bringToFront : function(win){
            win = this.get(win);
            if(win != front){
                win._lastAccess = new Date().getTime();
                orderWindows();
                return true;
            }
            return false;
        },

        /**
         * Sends the specified window to the back of other active windows.
         * @param {String/Object} win The id of the window or a {@link Ext.Window} instance
         * @return {Ext.Window} The window
         */
        sendToBack : function(win){
            win = this.get(win);
            win._lastAccess = -(new Date().getTime());
            orderWindows();
            return win;
        },
        /**
         * Executes the specified function once for every window in the group, passing each
         * window as the only parameter. Returning false from the function will stop the iteration.
         * @param {Function} fn The function to execute for each item
         * @param {Object} scope (optional) The scope in which to execute the function
         */
        each : function(fn, scope){
            for(var id in list){
                if(list[id] && typeof list[id] != "function"){
                    if(fn.call(scope || list[id], list[id]) === false){
                        return;
                    }
                }
            }
        }
    };
};

Ext.ux.StickyToolTip = Ext.extend(Ext.ToolTip, {
    initComponent : function(){
        this.autoHide = true;
        this.closable = false;
        this.pinned = false;
        this.draggable = true;
        //this.constrainPosition = true;
        //this.trackMouse = false;
        this.cls = 'SeqViewerApp';
        Ext.ux.StickyToolTip.superclass.initComponent.call(this);
        if(!this.title){
            this.elements += ',header';
        }
        this.addEvents({
            "pin" : true,
            "unpin" : true
        });
        if (this.target) {
            this.target.on('click', this.onTargetClick, this);
        }
    },
    // private
    afterRender : function(){
        Ext.ux.StickyToolTip.superclass.afterRender.call(this);
        this.addTool({
            id: 'pin',
            handler: this.toggelPin,
            scope: this,
            hidden: true
        },{
            id: 'unpin',
            handler: this.toggelPin,
            scope: this
        });
        this.standardZIndex = this.getEl().getZIndex();
        this.getEl().on('click', this.onMouseClick, this);
        this.getEl().on('click', this.onMouseUp, this);
    },
    onTargetClick : function(e) {
        this.dontShow = true;
    },

    onMouseClick : function(e) {
        if (this.manager)
            this.manager.bringToFront(this);
    },
    onMouseUp : function(e) {
        // we need this empty method here to prevent en exception
        // in case when the event came but the tooltip has already closed
    },

    toggelPin : function(e,t,panel) {
        if (!this.pinned) {
            panel.tools.pin.show();
            panel.tools.unpin.hide();
            this.fireEvent('pin', this);
            this.autoHide = false;
        } else {
            panel.tools.pin.hide();
            panel.tools.unpin.show();
            this.fireEvent('unpin', this);
            this.autoHide = true;
        }
        this.pinned = !this.pinned;
    },
    isPinned: function() {
        return this.pinned;
    },
    onTargetOut: function(e){
        if(this.disabled || e.within(this.target.dom, true)){
            return;
        }
        this.dontShow = true;
        // we need to delay this code slightly so we have time to
        // move mouse into the tooltip area.
        (function(e) {
            if ( this.isInsideTootTip(e) ) {
                this.clearTimer('dismiss');

                this.autoHide = false;
                this.getEl().on('mouseout', this.onMouseOut, this);
                return;
            }
            if(this.autoHide !== false){
                this.delayHide();
            }
        }).defer(1500,this,[e]);
    },
    onTargetOver: function(e){
        delete this.dontShow;
        Ext.ux.StickyToolTip.superclass.onTargetOver.call(this,e);
    },

    hide: function() {
        this.dontShow = true;
        if (this.getEl().dom) {
            Ext.ux.StickyToolTip.superclass.hide.call(this);
        }
    },
    show: function() {
        if (!this.dontShow) {
            Ext.ux.StickyToolTip.superclass.show.call(this);
            this.keepInArea();
        }
    },

    onEnable: function() {
        if (!this.dontShow) {
            Ext.ux.StickyToolTip.superclass.onEnable.call(this);
        }
    },
    onDocMouseDown : function(e){
        if (this.pinned)
            return;
        if (!this.isInsideTootTip(e)) {
            this.hide();
        }
        //if (this.pinned)
        //    return;
        Ext.ux.StickyToolTip.superclass.onDocMouseDown.call(this,e);
    },
    onMouseOut : function(e) {
        if (this.pinned || this.isInsideTootTip(e)) {
            return;
        }
        this.getEl().un('mouseout', this.onMouseOut, this);
        this.autoHide = true;
        this.clearTimer('show');
        if(this.autoHide !== false){
            this.delayHide();
        }
    },
    initDraggable : function(){
        Ext.ux.StickyToolTip.superclass.initDraggable.call(this);
        if (this.dd) {
            this.dd.startDrag = this.dd.startDrag.createSequence(function() {
            //    this.inDD = true;
                this.getEl().setZIndex(this.standardZIndex);
            }, this);
           this.dd.alignElWithMouse = this.dd.alignElWithMouse.createInterceptor( function(el, iPageX, iPageY) {
                return el !== null;
            }, this);
        }
    },
    isInsideTootTip: function(e) {
        var el = this.getEl();
        if (!el || !el.dom)
            return false;
        var xy = e.getXY();
        var x = el.getX();
        var y = el.getY();

        if ( (xy[0] > x && xy[0] < x + this.getInnerWidth()) &&
             (xy[1] > y && xy[1] < y + this.getInnerHeight() + 20) ) {
            return true;
        }
        return false;
    },
    onShow : function(){
        Ext.ux.StickyToolTip.superclass.onShow.call(this);
        if (this.manager) {
            this.manager.register(this);
            this.manager.bringToFront(this);
        }
    },
    onHide : function(){
        if (this.manager) {
            this.manager.unregister(this);
        }
        Ext.ux.StickyToolTip.superclass.onHide.call(this);
        this.destroy();
    },
    onDestroy : function() {
        if (this.target) {
            this.target.un('click', this.onTargetClick, this);
        }
        var el = this.getEl();
        if (el)
            el.un('mouseout', this.onMouseOut, this);
        Ext.ux.StickyToolTip.superclass.onDestroy.call(this);
    },

    doAutoWidth : function(adjust){
        adjust = adjust || 0;
        var bw = this.body.getTextWidth();
        if(this.title){
            var hw = this.header.child('span').getTextWidth(this.title);// + (this.closable ? 20 : 0);
            var tn = 0;
            for(var t in this.tools) { tn += 1; }
            hw += (tn-1)*15;
            bw = Math.max(bw, hw);
        }
        bw += this.getFrameWidth() + this.body.getPadding("lr") + adjust;
        this.setSize(bw.constrain(this.minWidth, this.maxWidth));
        if(Ext.isIE7 && !this.repainted){
            this.el.repaint();
            this.repainted = true;
        }
    },
    //the routine below is different from doAutoWidth by having adjusting the height of tootlip for IE
    // to get rid of vertical scrollbar. FF and Chrome are adjusting height fine.
    doAutoSize : function(adjust){
        adjust = adjust || 0;
        var bw = this.body.getTextWidth();
        if(this.title){
            var hw = this.header.child('span').getTextWidth(this.title);// + (this.closable ? 20 : 0);
            var tn = 0;
            for(var t in this.tools) { tn += 1; }
            hw += (tn-1)*15;
            bw = Math.max(bw, hw);
        }
        bw += this.getFrameWidth() + this.body.getPadding("lr") + adjust;
        this.setSize(bw.constrain(this.minWidth, this.maxWidth));
        var height = this.getHeight();
        var scrollOffset = Ext.getScrollBarWidth();
        var target = this.getLayoutTarget();
        var hasScroll = target.isScrollable();
        //height adjustment for IE
        if(hasScroll && Ext.isIE) {
            height += scrollOffset;
            this.autoHeight = false;
            this.deferHeight = false;//needed to prevent setting 'auto' for height in setHeight->setSize routine
            this.setHeight(height);
        }

        if(Ext.isIE7 && !this.repainted){
            this.el.repaint();
            this.repainted = true;
        }
    },

    keepInArea: function() {
        if (this.keepArea) {
            var xy = this.getEl().getXY();
            var width = this.getEl().getWidth();
            if (xy[0] + width > this.keepArea.x + this.keepArea.width)
                this.setPagePosition(xy[0]-(xy[0]+width-(this.keepArea.x + this.keepArea.width))-4 , xy[1]);
        }

    },
        // private
    addTool : function(){
        if(!this.rendered){
            if(!this.tools){
                this.tools = [];
            }
            Ext.each(arguments, function(arg){
                this.tools.push(arg);
            }, this);
            return;
        }
         // nowhere to render tools!
        if(!this[this.toolTarget]){
            return;
        }
        if(!this.ttoolTemplate){
            // initialize the global tool template on first use
            var tt = new Ext.Template(
                 '<div class="x-tool xsv-left-align x-tool-{id}">&#160;</div>'
            );
            tt.disableFormats = true;
            tt.compile();
            Ext.ux.StickyToolTip.prototype.ttoolTemplate = tt;
        }
        for(var i = 0, a = arguments, len = a.length; i < len; i++) {
            var tc = a[i];
            if(!this.tools[tc.id]){
                var overCls = 'x-tool-'+tc.id+'-over';
                var t = this.ttoolTemplate.insertBefore(this[this.toolTarget], tc, true);
                this.tools[tc.id] = t;
                t.enableDisplayMode('block');
                this.mon(t, 'click',  this.createToolHandler(t, tc, overCls, this));
                if(tc.on){
                    this.mon(t, tc.on);
                }
                if(tc.hidden){
                    t.hide();
                }
                if(tc.qtip){
                    if(Ext.isObject(tc.qtip)){
                        Ext.QuickTips.register(Ext.apply({
                              target: t.id
                        }, tc.qtip));
                    } else {
                        t.dom.qtip = tc.qtip;
                    }
                }
                t.addClassOnOver(overCls);
            }
        }
    }

});


Ext.namespace('SeqView');

if (navigator.maxTouchPoints > 1 || 'ontouchstart' in document) {
    Ext.lib.Event.getXY = function(e) {
        var touches = e.changedTouches;
        var ev = (touches && !Ext.isIE) ? touches[touches.length - 1] : e; 
        return [Math.round(this.getPageX(ev)), Math.round(this.getPageY(ev))];
    }
    SeqView.useTouch = true;
}

SeqView.makeTinyURL = function(url, callback) {
    var urlService = function() {
        var request = gapi.client.urlshortener.url.insert({'resource': {'longUrl': url}});
        request.execute(function(res) {
            res.id = res.id.replace(/http:/, 'https:');
            callback(res);
        });
    }
    if (typeof gapi === 'undefined') { // load gapi
        SeqView.loadGAPI(url, callback);
        return; 
    }
    if (!gapi.client) {
        if (!gapi.load) callback({id: false}); //not loaded
        else // wait while loading
            setTimeout(function(){SeqView.makeTinyURL(url, callback);}, 500);
        return;
    }
    if (!gapi.client.urlshortener) {
        var googleAPIkey = 'AIzaSyC998TlAgTLRQd91sRa2NJDDE8ieXrr5XQ';
        gapi.client.setApiKey(googleAPIkey);
        gapi.client.load('urlshortener', 'v1', urlService);
    } else urlService();
}

SeqView.Cookies = function(config) {
    this.path = "/";
    this.expires = new Date(new Date().getTime()+(1000*60*60*24*7)); //7 days
    this.domain = ".nih.gov"; // this is essential for proper cookie functioning
    this.secure = false;
    Ext.apply(this, config);

    var readCookies = function() {
        var cookies = {};
        var c = document.cookie + ";";
        var re = /\s?(.*?)=(.*?);/g;
        var matches;
        while((matches = re.exec(c)) != null){
            var name = matches[1];
            // fix incorect cookie name for IE8 (like 'WebCubbyUser; sv-user-data')
            var a = name.split(';');
            name = a[a.length-1].trim();
            var value = matches[2];
            cookies[name] = value;
        }
        return cookies;
    }
    this.state = readCookies();
};

SeqView.Cookies.MaxDate = new Date(new Date('10000/01/01 GMT').getTime()-100);
SeqView.Cookies.UserTracksCookieNameBase = 'sv-usertracks-key';
SeqView.Cookies.UserDataCookieNameBase = 'sv-userdata-key';
SeqView.Cookies.AppDataCookieNameBase = 'sv-data-key';
SeqView.Cookies.UserTracksCookieName = SeqView.Cookies.UserTracksCookieNameBase;
SeqView.Cookies.UserDataCookieName = SeqView.Cookies.UserDataCookieNameBase;
SeqView.Cookies.AppDataCookieName = SeqView.Cookies.AppDataCookieNameBase;

SeqView.Cookies.prototype = {
    get : function(name, defaultValue){
        return typeof this.state[name] == "undefined" ?
            defaultValue : this.state[name];
    },

    set : function(name, value){
        if(typeof value == "undefined" || value === null){
            this.clear(name);
            return;
        }
        this.setCookie(name, value);
        this.state[name] = value;
    },

    clear : function(name){
        delete this.state[name];
        this.clearCookie(name);
    },

    // private
    setCookie : function(name, value){
        document.cookie = name + "=" + value +
           ((this.expires == null) ? "" : ("; expires=" + this.expires.toGMTString())) +
           ((this.path == null) ? "" : ("; path=" + this.path)) +
           ((this.domain == null) ? "" : ("; domain=" + this.domain)) +
           ((this.secure == true) ? "; secure" : "");
    },

    // private
    clearCookie : function(name){
        document.cookie = name + "=del; expires=Thu, 01-Jan-1970 00:00:01 GMT" +
           ((this.path == null) ? "" : ("; path=" + this.path)) +
           ((this.domain == null) ? "" : ("; domain=" + this.domain)) +
           ((this.secure == true) ? "; secure" : "");
    }
};
SeqView.SessionData = new SeqView.Cookies({expires:null, secure:Ext.isSecure});
SeqView.UserTracks = new SeqView.Cookies({expires:SeqView.Cookies.MaxDate, secure:Ext.isSecure});
SeqView.trackSets = {tmsSets: [], usrSets: [], trackLists: []};

SeqView.configureTrackSets = function(app) {
    TMS.TrackSets.TrackSetService.SetAssembly(app.m_AssmContext);
    TMS.TrackSets.GetDefaultTrackSet('SViewer', app.m_AppContext, app.m_AssmContext)
        .done(function() {
            app.m_defaultTrackSet = this.GetTracks();
        })
        .fail(function() {
            console.log('Failed to get default track set');
        });
    SeqView.requestTrackSets = function(callback) {
        TMS.TrackSets.TrackSetService.GetTracksets(true)
           .done(callback)
           .fail(function() {
               callback([]);
//               console.log("Failed to get track sets");
           }
        );
    }
};

SeqView.AreaFlags = {
    Link:           (1 << 0), ///< a direct link stored in m_Action
    CheckBox:       (1 << 1), ///< a toggle button/icon
    NoSelection:    (1 << 2), ///< the object can't be selected
    ClientSelection:(1 << 3), ///< the selection can be done on client
    NoHighlight:    (1 << 4), ///< on highlighting on mouse over
    NoTooltip:      (1 << 5), ///< do not request and show tooltip
    TooltipEmbedded:(1 << 6), ///< tooltip embedded
    Track:          (1 << 7), ///< track title bar
    Ruler:          (1 << 8),  ///< ruler bar
    Editable:       (1 << 9),  ///< editable area
    NoPin:          (1 << 10), ///< not pinnable
    IgnoreConflict: (1 << 11), ///< feature can be ignored (isca browser feature editing only)
    Sequence:       (1 << 12), ///< sequence track flag
    Comment:        (1 << 13), ///< render a label/comment on client side
    DrawBackground: (1 << 14), ///< highlight background for this area
    Dirty:          (1 << 16), ///< dirty flag
    NoNavigation:   (1 << 17),  ///< no havigation buttons on title bar
    Legend:         (1 << 18)   ///< legends for graph_overlay tracks
};

SeqView.ClearBrowserSelection = function() {
    var sel;
    try {
    if( document.selection && document.selection.empty ){
        document.selection.empty();
    } else if( window.getSelection ){
        sel = window.getSelection();
        if( sel && sel.removeAllRanges ){ sel.collapseToEnd(); }
    }
    } catch(e) {}
};

SeqView.IsNumeric = function(str) {
    var pattern = /^-?[0-9]+(\.[0-9]*)?[km]?$/i;
    return pattern.test(str);
};

SeqView.stringToNum = function(pos_str) {
    if (!pos_str) return;
    pos_str = pos_str.replace(/[, ]/g,'');
    if (pos_str.length < 1) return;
    var multiplier = 1;
    var last_char = pos_str.charAt(pos_str.length - 1).toUpperCase();
    if (last_char == 'K' || last_char == 'M') {
        pos_str = pos_str.substr(0, pos_str.length - 1);
        if (last_char == 'K') {
           multiplier = 1000;
        } else {
           multiplier = 1000000;
        }
    }
    var dec_part = 0;
    if (multiplier > 1) {
        var dec_pos = pos_str.indexOf('.');
        if (dec_pos != -1) {
            dec_part = Math.floor(parseFloat(pos_str.substr(dec_pos)) * multiplier);
            pos_str = pos_str.substr(0, dec_pos);
        }
    }
    return multiplier * parseInt(pos_str) + dec_part;
};

// Escape handles symbols innocuous from the point of view of HTML/HTTP
// but used internally in names, which are ususally provided by the user
// and as such are out of control. Encoding schema is according to SV-591
// and SV-1379:
// Prepend \ | , : [ ] with backslash, encode & ; # % as \hex-code, encode
// ' " = and space using standard %hex notation.
// Added a parameter 'symbs' allowing to process only a specific set of symbols
SeqView.escapeName = function(s, symbs) {
    var res = "";
    var parts = [];
    if (!symbs) parts = cbSplit(s, /([\]\[\\\|\'\"= ,:;&#%])/);
    else parts = cbSplit(s, symbs);
    for (var len = parts.length, i = 0; i < len;) {
        res += parts[i++];
        var sym = parts[i++];
        if (!sym) break;
        if (/[\]\[\\\|,:]/.test(sym))
            res += "\\" + sym;
        else {
            if (/['"= ]/.test(sym))
                res += "%";
            else
                res += "\\"; // ; & # %
            res += sym.charCodeAt(0).toString(16);
        }
    }
    return res;
};

SeqView.escapeTrackName = function(s, symbs) {
    var res = "";
    if (!symbs) symbs = /([\]\[\\\|,:=&;"#%])/;
    var parts = cbSplit(s, symbs);
    for (var len = parts.length, i = 0; i < len;) {
        res += parts[i++];
        var sym = parts[i++];
        if (!sym) break;
        res += "\\";
        if (/[=&\\;"#%]/.test(sym)) {
            res += sym.charCodeAt(0).toString(16);
        } else {
            res += sym;
        }
    }
    return res;
};

SeqView.unescapeName = function(s) {
    var parts = unescape(s).split("\\");
    var res = parts[0];
    for (var len = parts.length, i = 1; i < len; i++) {
        var part = parts[i];
        if (part.length == 0)
            res += "\\" + parts[++i];
        else if (/[\]\[\\\|,:]/.test(part.charAt(0)))
            res += part;
        else if (/^[0-9a-f]{2}.*/.test(part)) {
            res += String.fromCharCode(parseInt(part.slice(0,2), 16)) + part.slice(2);
        }
    }
    return res;
};


SeqView.sanitize = function(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

String.prototype.visualLength = function() {
   var ruler = document.getElementById('string_ruler_unit');
   ruler.innerHTML = this.replace(/&/g, "&amp;").replace(/</g, "&lt;")
                              .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
   return ruler.offsetWidth;
};

SeqView.getHelpURL = function() {
    return 'https://www.ncbi.nlm.nih.gov/tools/sviewer/';  
};

SeqView.showHelpDlg = function(extra_params) {
    window.open(SeqView.getHelpURL() + (extra_params ? extra_params : ''));
};

SeqView.showAboutMessage = function() {
    var msg = '<p>NCBI Graphical Sequence Viewer - graphical display for the Nucleotide and Protein sequences.</p>Version 3.11.2<br><br><span style="font-size:10px;">Revision: 34247, install date: 2015-12-04 11:48</span><br>';
    msg += '<br><a href=\"' + SeqView.base_url + 'info.html' + '\" target=\"_blank\" style=\"color:blue\">CGI binaries Info</a>';
    Ext.Msg.show({
        title: 'Sequence Viewer',
        msg: msg,
        maxWidth: '320',
        minWidth: '300',
        buttons: Ext.Msg.OK
    });
}

SeqView.getVersion = function() {
    return 3112;
}

SeqView.getVersionString = function() {
    return '3.11.2';
}

SeqView.decode = function(data) {
    return (typeof data === 'object') ? data : Ext.decode(data);
}


function setActiveScriptBase() {
    var dlhn = document.location.hostname;
    SeqView.NCBI = {domain: 'ncbi.nlm.nih.gov', host_url: "https://"};

    SeqView.NCBI.host_url += (dlhn.indexOf(SeqView.NCBI.domain) == -1 || dlhn.indexOf('blast.' + SeqView.NCBI.domain) >= 0)
        ? ('www.' + SeqView.NCBI.domain) : dlhn;

  // Safe value - production
  var base = "//www.ncbi.nlm.nih.gov/projects/sviewer";
  var host = "//www.ncbi.nlm.nih.gov/";
  var scriptUrl = "";
  if (document.currentScript) {
    // If the browser supports this HTML5 construct, we trust it
    scriptUrl = document.currentScript.src;
  } else {
    var t = document.scripts;
    if (t) {
      // Usually it is the last script in the list - the script we're just executing,
      // but the script loading model is becoming asynchronous, so we need a more
      // thorugh check and pass through the script list.
      for (var i = t.length-1; i > 0; i--) {
        var url = t[i].src; // .replace(/\/\//g, '\/');
        var res = url.match(/^(.*ncbi\.nlm\.nih\.gov\/.*\/sviewer)\/js\/(main|svmain|sviewer)\.js/);
        if (res) {
          scriptUrl = url;
          break;
        }
      }
    }
  }
  // Check for /js/main.js or /js/sviewer.js js/svmain.js ending and trim it
  var res = scriptUrl.match(/^(.*)\/js\/(main|svmain|sviewer)\.js/);
  if (res) {
    base = res[1];
  }
  res = base.match(/^.*\.ncbi\.nlm\.nih\.gov\//);
  if (res) {
    host = res[0];
  }
  var uud = host + "projects/uud/";
  if (base.charAt(base.length-1) !== '/') base += '/';
  SeqView.base_url = base;
  SeqView.host_url = host;
  SeqView.uud_base_url  = uud;
  return base;
}

setActiveScriptBase();

/*  $Id: locator.js 33931 2015-10-01 21:36:03Z borodine $
 * ===========================================================================
 *
 *                            PUBLIC DOMAIN NOTICE
 *               National Center for Biotechnology Information
 *
 *  This software/database is a "United States Government Work" under the
 *  terms of the United States Copyright Act.  It was written as part of
 *  the author's official duties as a United States Government employee and
 *  thus cannot be copyrighted.  This software/database is freely available
 *  to the public for use. The National Library of Medicine and the U.S.
 *  Government have not placed any restriction on its use or reproduction.
 *
 *  Although all reasonable efforts have been taken to ensure the accuracy
 *  and reliability of the software and data, the NLM and the U.S.
 *  Government do not and cannot warrant the performance or results that
 *  may be obtained by using this software or data. The NLM and the U.S.
 *  Government disclaim all warranties, express or implied, including
 *  warranties of performance, merchantability or fitness for any particular
 *  purpose.
 *
 *  Please cite the author in any work or product based on this material.
 *
 * ===========================================================================
 *
 * Authors:  Vlad Lebedev, Maxim Didenko
 *
 * File Description: Locator for the overview panel & alignment panel
 *
 */

/* locator */
SeqView.Locator = function(view, color, resizable) {
    this.m_View = view; // view 
    this.m_panorama = Ext.get(view.m_App.m_Views[0].m_DivId);

    var tmpl_string_pan = '<div id="pan_scroller_{idx}" class="pan-bar" style="background-color:#{color};position:absolute;top:0px;left:0px;"></div>';
    var tmpl_string = '<div id="seq_g{idx}" style="position:absolute;top:17px;left:0px;width:1px;">';
    tmpl_string += '<div class="locator_rect"></div>';
    if (resizable) {
        tmpl_string += '<div id="left_resizer_{idx}" class="left-resizer"></div><div id="right_resizer_{idx}" class="right-resizer"></div>';
    }
    tmpl_string += '</div>';
      
    var idx = this.m_View.m_Idx;     
    var tpl_pan = new Ext.Template(tmpl_string_pan);
    var tpl = new Ext.Template(tmpl_string);
    var panorama_height = this.getPanoramaHeight();
    this.element_pan = tpl_pan.insertFirst(this.m_panorama, {idx:idx, qtip:'View #', color:color, adjheight: panorama_height-19}, true);
    this.element = tpl.insertFirst(this.m_panorama, {idx:idx, qtip:'View #', color:color, adjheight: panorama_height-19}, true);
    this.element.setHeight(panorama_height - 2);

    this.element_pan.on({
        'mousedown'  : this.onMouseDown,
        'touchstart' : this.onMouseDown,
        'contextmenu':  this.onContextMenu,  
        scope: this
    });
    
    if (resizable) {  
        Ext.get("left_resizer_" + idx).on({
            'mousedown' : this.onMouseDown,
            'touchstart': this.onMouseDown,
            scope: this
        });
        Ext.get("right_resizer_" + idx).on({
            'mousedown' : this.onMouseDown,
            'touchstart': this.onMouseDown,
            scope: this
        });
    }
};

SeqView.Locator.prototype = {
    getElement:  function() { return this.element; },    
    setColor:  function(color) {
        Ext.get('pan_scroller_'+this.m_View.m_Idx).setStyle('background-color', '#'+color);
        Ext.get(this.m_View.m_DivId).parent().setStyle('borderLeftColor', '#'+color);
    },
    setHeight:  function(h) { 
        this.element.setHeight(h - 17);  
    },
    getLeft:  function(local) { return this.element.getLeft(local); },
    setLeft:  function(pos) { 
        var panorama_width = this.getPanoramaWidth();
        var bar_pos = pos;
        if(pos + 24 > panorama_width)
            bar_pos = panorama_width - 24;

        this.element_pan.setLeft(bar_pos);
        this.element.setLeft(pos); 
    },
    getWidth:  function(contentWidth) { return this.element.getWidth(contentWidth); },
    setWidth: function(width) { 
        this.element.setWidth(width); 
    }, 
    getRight:  function(local) { return this.element.getRight(local); },
    remove:  function() { 
        this.element_pan.remove(); 
        this.element.remove(); 
    },

    getPanoramaWidth: function() {
        return this.m_View.m_App.getPanoramaWidth();
    },
    getPanoramaHeight: function() {
        return this.m_View.m_App.getPanoramaHeight();
    },


//////////////////////////////////////////////////////////////////////////
// onMouseDown:

    onMouseDown: function(e) {
        if (this.m_ContextMenu) this.m_ContextMenu.destroy();
        if ((e.type == 'mousedown' && e.button) || this.m_View.m_App.m_Panorama.m_Loading) return;
        var elem = e.getTarget().id;
        this.m_XY = e.getXY();
        this.m_Action = 'Resize';         
        if (elem.indexOf('left_resizer') == 0) {
            this.m_moveHandler = function(delta) {
                var old_left = this.getLeft(true);
                var new_left = Math.max(0, old_left - delta);
                new_left = Math.min(this.getRight(true) - 2, new_left);
                var new_width = this.getWidth() + (old_left - new_left);
                if (this.m_View.checkLocatorWidth(new_width) ) {
                    this.setLeft(new_left);
                    this.setWidth(new_width);
                    this.m_Action = 'Resize';
                }
            }
        } else if (elem.indexOf('right_resizer') == 0) {
            this.m_moveHandler = function(delta) {
                var new_width = Math.max(2, this.getWidth() - delta);
                new_width = Math.min(this.getPanoramaWidth() - 2 - this.getLeft(true), new_width);
                if (this.m_View.checkLocatorWidth(new_width) ) {
                    this.setWidth(new_width);
                    this.m_Action = 'Resize';
                }
            }
        } else if (elem.indexOf('pan_scroller') == 0) {
            if (e.type != 'mousedown')
                this.m_deferredContext = SeqView.fireEvent.defer(2000, this, ['contextmenu', elem]);
            this.m_moveHandler = function(delta) {
                var new_left = Math.max(0, this.getLeft(true) - delta);
                new_left = Math.min(this.getPanoramaWidth() - 2 - this.getWidth(), new_left);
                this.setLeft(new_left);
                this.m_Action = 'Drag';     
            }
        } else { return; }
            
        var locator = this;
        var onMove = function(e) {
            locator.onMouseMove(Ext.EventObject.setEvent(e ? e : window.event));
        }
        var onEnd = function(e) {
            locator.onMouseUp(Ext.EventObject.setEvent(e ? e : window.event));
        }
        if (e.button == 0) {
            this.m_DocMouseMove = document.onmousemove;
            this.m_DocMouseUp = document.onmouseup;
            document.onmousemove = onMove;
            document.onmouseup = onEnd;
        } else {
            this.m_DocTouchMove = document.ontouchmove;
            this.m_DocTouchUp = document.ontouchend;
            document.ontouchmove = onMove;
            document.ontouchend = onEnd;
        }                
        e.stopEvent();
    },

    onMouseUp: function(e) {
        if (this.m_Action) {
            this.m_View.syncToLocator();
            SeqView.pingClick('1-0-' + this.m_Action.charAt(0), 'Panorama_Locator_' + this.m_Action);
        }
        if (this.m_deferredContext) {   
            clearTimeout(this.m_deferredContext);
            this.m_deferredContext = 0;
        }
        this.m_moveHandler = function(){};
        this.m_Action = '';  
        this.m_XY = null;
        if (e.button == 0) {
            document.onmousemove = this.m_DocMouseMove;
            document.onmouseup = this.m_DocMouseUp;
        }
        else {
            document.ontouchmove = this.m_DocTouchMove;
            document.ontouchend = this.m_DocTouchUp;            
        }
        this.m_DocMouseMove = this.m_DocMouseUp = this.m_DocTouchMove = this.m_DocTouchUp = null;
        e.stopPropagation();
    },

//////////////////////////////////////////////////////////////////////////
// onMouseMove:
    
    onMouseMove: function(e) {
        if (!this.m_XY) return;
        SeqView.ClearBrowserSelection();
        var majicSensivity = 5; 
        var xy = e.getXY();
        if (e.browserEvent.changedTouches && this.m_deferredContext) {
            if (Math.abs(xy[0] - this.m_XY[0]) > majicSensivity
             || Math.abs(xy[1] - this.m_XY[1]) > majicSensivity)
            {   
                clearTimeout(this.m_deferredContext);
                this.m_deferredContext = 0;
            }
        }
        this.m_moveHandler(this.m_XY[0] - xy[0]);
        this.m_XY = xy; // save new values        
        e.stopPropagation();
    },

//////////////////////////////////////////////////////////////////////////
// onMouseOut:

    onMouseOut: function(e) {
        //console.log(e);
    },

    onContextMenu: function(e) {
        e.stopEvent();
        var menu = new Ext.menu.Menu();
        var elem = e.getTarget().id;
        if (!this.m_deferredContext) {   
            this.m_XY = e.getXY();
        } else {
            this.m_deferredContext = 0;
            this.m_ContextMenu = menu;
        } 
        var pan_scroller = Ext.get(elem);
        var idx = elem.split('_')[2];
        var seq_id = 'seq_g' + idx;
        menu.add([{ 
                text: 'Bring to front', handler:function() {             
                    var pan_holder = Ext.get('pan-holder');
                    var seq_g = Ext.get(seq_id);
                    seq_g.insertBefore(pan_holder);
                    pan_scroller.insertAfter(seq_g);
                    }}, {
                text: 'Sent to back', handler:function() {  
                    var seq_id = 'seq_g' + idx;
                    var seq_g = Ext.get(seq_id);
                    this.m_panorama.insertFirst(seq_g)
                    pan_scroller.insertAfter(seq_g);
                    }, scope: this }, {
                text: 'View color change',
                    menu:new Ext.menu.ColorMenu({listeners: {'select': function(cm, color) {
                        this.m_View.m_Color = color;
                        this.setColor(color);
                        this.m_View.m_App.reCreateReflections();
                    }, scope: this }})
                }
            ]);
        menu.showAt(this.m_XY);
    }
};


/*  $Id: reflection.js 24469 2011-09-28 19:38:23Z voronov $
 * ===========================================================================
 *
 *                            PUBLIC DOMAIN NOTICE
 *               National Center for Biotechnology Information
 *
 *  This software/database is a "United States Government Work" under the
 *  terms of the United States Copyright Act.  It was written as part of
 *  the author's official duties as a United States Government employee and
 *  thus cannot be copyrighted.  This software/database is freely available
 *  to the public for use. The National Library of Medicine and the U.S.
 *  Government have not placed any restriction on its use or reproduction.
 *
 *  Although all reasonable efforts have been taken to ensure the accuracy
 *  and reliability of the software and data, the NLM and the U.S.
 *  Government do not and cannot warrant the performance or results that
 *  may be obtained by using this software or data. The NLM and the U.S.
 *  Government disclaim all warranties, express or implied, including
 *  warranties of performance, merchantability or fitness for any particular
 *  purpose.
 *
 *  Please cite the author in any work or product based on this material.
 *
 * ===========================================================================
 *
 * Authors:  Vlad Lebedev, Maxim Didenko
 *
 * File Description: Visible range reflections in the viewer
 *
 */
 
 
/* view reflections */

/********************************************************************/
//////////////////////////////////////////////////////////////////////
// SeqView.Reflection 
/********************************************************************/

 SeqView.Reflection = function(this_view, show_view) {
    this.m_PrevXY = [];

    this.m_View = this_view; // view index
    this.m_ShowView = show_view; // view index
    
    var color = this.m_ShowView.m_Color;
    
    this.parent_id = this.m_View.m_DivId;
    this.parent_elem = Ext.get( this.parent_id );
    
    var vis_range = this.m_ShowView.toSeq();
    var qtip = ( vis_range[0] +1 ) + ' : ' + ( vis_range[1] +1 );
    
    var tpl = new Ext.Template(
	    '<div id="reflection_id_{idx}_{sidx}" ext:qtip="{qtip}" class="reflection" style="z-index:10;background-color:#{color};"/>'
	);
    this.element = tpl.append(
		this.parent_elem, 
		{idx:this.m_View.m_Idx,sidx:this.m_ShowView.m_Idx, qtip:qtip, color:color}, 
		true
	);
    
	this.element.on({
        'mousedown' : this.onMouseDown,
        //'mouseup' :   this.onMouseUp,
        //'mousemove' : this.onMouseMove,
        scope:this
    });

 	this.update();
}


SeqView.Reflection.prototype = {

	update: function() {
	
		if( !this.m_View || !this.m_ShowView ) return;
	
		var show_range = this.m_ShowView.toSeq();
		// conversion in pixels
		var f = this.m_View.seq2Pix( show_range[0] ); 
		var t = this.m_View.seq2Pix( show_range[1] );

		if( this.m_View.getFlip() ){
			this.element.setLeft( Math.round( t +this.m_View.m_ScrollPix ) ); // mind the scroll offset!
			this.element.setWidth( Math.round( f -t ) );
		} else {
			this.element.setLeft( Math.round( f +this.m_View.m_ScrollPix ) ); // mind the scroll offset!
			this.element.setWidth( Math.round( t -f ) );
		}
		
		var tooltip_id = "reflection_id_" + this.m_View.m_Idx + "_" + this.m_ShowView.m_Idx;
		var tooltip = Ext.get( tooltip_id );

		if( tooltip ){
			var qtip = (show_range[0]+1) + '-' + (show_range[1]+1);
			var qtsetup = {};
			qtsetup["ext:qtip"] = qtip;
			tooltip.set( qtsetup );
		}	
	},

    movePix: function(delta) {
        var new_left = this.element.getLeft(true) - delta;
        this.element.setLeft(new_left);
    },
    
    remove: function() { this.element.remove(); },
    
    scrollPix: function(view, delta) {
        if (this.m_View.m_Idx == view.m_Idx) { // scroll as one (locked)
            var new_left = this.element.getLeft(true) - delta;
            this.element.setLeft(new_left);
        } else if (this.m_ShowView.m_Idx == view.m_Idx) {
            var vis_range = view.toSeq();
            var f = this.m_View.seq2Pix(vis_range[0]); // in pixels
            this.element.setLeft( f + this.m_View.m_ScrollPix ); // mind the scroll offset!
        }
    },
    
//////////////////////////////////////////////////////////////////////////
// onMouseDown:

    onMouseDown: function(e) {
        if (e.button === 0) {
            this.m_PrevXY = e.getXY(); 
            this.element.setStyle('cursor', 'move');
            this.m_DocMouseMove = document.onmousemove;
            this.m_DocMouseUp = document.onmouseup;
            var refl = this;
            document.onmousemove = function(e) {
                if (!e) { e = window.event; }
                e = Ext.EventObject.setEvent(e);
                refl.onMouseMove(e);
            }
            document.onmouseup = function(e) {
                if (!e) { e = window.event; }
                e = Ext.EventObject.setEvent(e);
                refl.onMouseUp(e);
            }
        }
    },

//////////////////////////////////////////////////////////////////////////
// onMouseUp:

    onMouseUp: function(e) {
        if (!this.m_PrevXY) { return; }
        this.element.setStyle('cursor', 'pointer');
        var flip = this.m_View.getFlip();
        
        var pix_from = Math.abs(this.m_View.m_ScrollPix) + this.element.getLeft(true);
        var pix_to   = pix_from + this.element.getWidth();
              
        var from_seq = this.m_View.pix2Seq(flip ? pix_to : pix_from);
        var to_seq   = this.m_View.pix2Seq(flip ? pix_from : pix_to);
        
        this.m_ShowView.startImageLoading(from_seq, to_seq-from_seq+1);
        
        document.onmousemove = this.m_DocMouseMove;
        document.onmouseup = this.m_DocMouseUp;
        this.m_DocMouseMove = null;
        this.m_DocMouseUp = null;
        this.m_PrevXY = null;
    },

//////////////////////////////////////////////////////////////////////////
// onMouseMove:

    onMouseMove: function(e) {
        if (!this.m_PrevXY) { return; }
        var xy = e.getXY();
        var delta_x = this.m_PrevXY[0] - xy[0];
        var new_left = this.element.getLeft(true) - delta_x;
        this.element.setLeft(new_left);
        this.m_PrevXY = xy;
    }
    
};

/********************************************************************/
//////////////////////////////////////////////////////////////////////
// SeqView.ReflectionCont 
/********************************************************************/

SeqView.ReflectionCont = function(app) {
    this.m_App = app;
    this.m_AllReflections = [];
    
};

SeqView.ReflectionCont.prototype = {
    
    reCreate: function() {
        this.deleteAll();

        this.m_App.forEachView(function(this_view) {
            if (this_view.isGraphic()) {
                this.m_App.forEachView(function(show_view) { // create new ones
                    if (show_view.isGraphic() &&  show_view.m_Idx != this_view.m_Idx) {
                        this.m_AllReflections.push(new SeqView.Reflection(this_view, show_view));
                    }
                }, this);
                if (this.m_App.m_TextView) { // sequence text  view shown
                    this.m_AllReflections.push(new SeqView.Reflection(this_view, this.m_App.m_TextView));
                }
            }
        },this);
    },

	updateAll: function() {
        for( var i = 0; i < this.m_AllReflections.length; i++ ){ 
            this.m_AllReflections[i].update();
        }
	},
   
    deleteAll: function() {
        for (var i = 0; i != this.m_AllReflections.length; i++) { 
            this.m_AllReflections[i].remove();
        }
        this.m_AllReflections = [];
    },
    
    scrollPix: function(view, delta) {
        for (var i = 0; i != this.m_AllReflections.length; i++) {
            var reflection = this.m_AllReflections[i];
            reflection.scrollPix(view, delta);
        }
    }
   
};




/*  $Id: selection.js 34247 2015-12-03 22:08:20Z rudnev $
 * ===========================================================================
 *
 *                            PUBLIC DOMAIN NOTICE
 *               National Center for Biotechnology Information
 *
 *  This software/database is a "United States Government Work" under the
 *  terms of the United States Copyright Act.  It was written as part of
 *  the author's official duties as a United States Government employee and
 *  thus cannot be copyrighted.  This software/database is freely available
 *  to the public for use. The National Library of Medicine and the U.S.
 *  Government have not placed any restriction on its use or reproduction.
 *
 *  Although all reasonable efforts have been taken to ensure the accuracy
 *  and reliability of the software and data, the NLM and the U.S.
 *  Government do not and cannot warrant the performance or results that
 *  may be obtained by using this software or data. The NLM and the U.S.
 *  Government disclaim all warranties, express or implied, including
 *  warranties of performance, merchantability or fitness for any particular
 *  purpose.
 *
 *  Please cite the author in any work or product based on this material.
 *
 * ===========================================================================
 *
 * Authors:  Vlad Lebedev, Maxim Didenko, Victor Joukov
 *
 * File Description: Mouse-over selection
 *
 */
//test
SeqView.SelectionToolTip = Ext.extend(Ext.ux.StickyToolTip, {
    //dismissDelay:5000,
    dismissDelay:0,
    hideDelay:0,
    showDelay: 500,
    quickShowInterval: 0,
    autoScroll:true,
    mouseOffset: [7,9],
    anchorToTarget: false,
    header: true, //this is to later on set the title of tooltip
    anchor: false,

    initComponent : function(){

        this.target = this.selection.element;
        this.gview = this.selection.m_View;
        this.area = this.selection.area;
        this.title = this.selection.title;
        this.tooltip = this.area.tooltip;
        this.basiclinks = this.area.basiclinks;
        this.extralinks = this.area.extralinks;
        this.downloadlinks = this.area.downloadlinks;
        this.primeButts = this.area.primeButts;
        this.manager = this.gview.ToolTipsMgr;
        this.minWidth = this.defaultMinWidth = 50;
        this.maxWidth = this.defaultMaxWidth = 300;


        this.keepArea = {x:this.gview.getXY()[0], y:this.gview.getXY()[1],width:this.gview.getScreenWidth(), height:this.gview.getScreenHeight()};
        this.areaShown = true;

        if( !this.area.title ){
            var title = null;
            if( this.area.range ){
                title = (this.area.range[0]+1) + ".." +(this.area.range[1]+1);
            } else if( this.area.name ){
                title = this.area.name;
            }
            title = '&nbsp;&nbsp;&nbsp;&nbsp;' + title;
            this.title = title;

        } else {
            this.title = this.area.title;
        }

        SeqView.SelectionToolTip.superclass.initComponent.call(this);
        this.on({
            'pin' : function(tt) {
                SeqView.pingClick('6-1');
                tt.area.qtip = tt;
                tt.tools.search.show();
            },
            'unpin' : function(tt) {
                delete tt.area.qtip;
                tt.tools.search.hide();
                tt.delayHide();
            }
        });
    },

    updateContent: function(show_links, el) {
        el = el || this.body;

        var collabsedToolTips = 'NCBI/SV/ToolTips/collabsed';
        if (show_links == null)
            if (typeof localStorage === undefined) show_links = true;
            else show_links = (localStorage[collabsedToolTips] === undefined);
        else
          if (typeof localStorage !== undefined) {
              if (show_links) localStorage.removeItem(collabsedToolTips);
              else localStorage.setItem(collabsedToolTips, '');
          }

        if (this.area.title) {
            this.title = "&nbsp;&nbsp;&nbsp;&nbsp;" + this.area.title;
            if( el.dom ){
                this.setTitle( this.title );
            }
        }

        var content = this.tooltip;
        var lt_added = false;

        if (this.downloadlinks) {
            content += this.downloadlinks;
        }
        if (this.basiclinks) {
            content += '<br/><br/><b>Links & Tools</b><br/>';
            content += this.basiclinks;
            lt_added = true;
        }
        try {
            if (show_links) {
                if (this.extralinks) {
                    if (!lt_added) content += '<br/><b>Links & Tools</b>';
                    content += '<br/>' + this.extralinks;
                }
                if(this.tools.down) this.tools.down.hide();
                if(this.tools.up) this.tools.up.show();
            } else {
                if(this.tools.down) this.tools.down.show();
                if(this.tools.up) this.tools.up.hide();
            }
            if (!this.extralinks || this.extralinks.length == 0) {
                if(this.tools.up) this.tools.up.hide();
                if(this.tools.down) this.tools.down.hide();
            }
            content += this.primeButts || '';
            el.update(content);

            this.trackNameToolTip(el,this);
            var adjustment = 13;

            this.measureWidth = false; // This is an undocumented property measureWidth
            // Value 'false' allows to avoid caling doAutoWidth() wrongfully recalculating the TT box width before calling setPagePosition()
            // Otherwise second and further showing of the TT may be accompanied by a horizontal scrollbar
            if (Ext.isIE) this.doAutoWidth();
            else this.doAutoSize();

            var target = this.getLayoutTarget();
            this.doLayout();
            var isScrollable = function() {
                return (Ext.isIE) ? target.dom.clientWidth < target.dom.scrollWidth : target.isScrollable();
            }
            while (isScrollable() && this.minWidth < 500) {
                if ((target.dom.scrollWidth + adjustment) == this.minWidth) {
                    break;
                }
                this.minWidth = this.maxWidth = Math.min(target.dom.scrollWidth + adjustment, 500);
                if (Ext.isIE) this.doAutoWidth(); else this.doAutoSize();
            }
            this.minWidth = this.defaultMinWidth;
            this.maxWidth = this.defaultMaxWidth;

            if (el.getHeight() > 600) el.setHeight(600);
            this.keepInArea();
            this.syncShadow();
            this.doLayout();
        } catch(err) {}
    },
    // private
    afterRender : function(){
        SeqView.SelectionToolTip.superclass.afterRender.call(this);
        if ((this.area.type & SeqView.AreaFlags.NoPin) !== 0) {
            var tls = ['pin','unpin'];
            for (var i = 0; i < tls.length; ++i) {
                this.tools[tls[i]].hide();
            }
        } else {
            var tls = this.gview.m_App.getCustomToolTipTools(this.selection);
            if (tls && tls.length > 0) {
                for (var i = 0; i < tls.length; i++) {
                    this.addTool(tls[i]);
                }
            }
            this.addTool({
                id: 'search',
                handler: this.showFeat,
                hidden: true,
                scope: this
            },{
                id: 'magnify',
                handler: this.loadAreaRange,
                scope: this
            },{
                id: 'up',
                scope: this,
                hidden:true,
                handler: function() {
                    this.updateContent(false);
                }
            },{
                id: 'down',
                scope: this,
                hidden: true,
                handler: function() {
                    SeqView.pingClick('6-4');
                    this.updateContent(true);
               }
            });
        }
        this.getEl().on('click', this.onMouseClick, this);
        if (this.area.tooltip && this.area.tooltip.length > 0)
            this.updateContent();

    },

    trackNameToolTip: function(el, comp) {
        if (!(this.area.type & SeqView.AreaFlags.Track)) return;

        SeqView.ping({"jsevent": "mouseover","sv-event":"Track_ToolTip"});
        //attention: the tooltip text is removed below and wrapped as label - this is done because of
        //JS error in IE that throws error when adding button or link after not wrapped text
        // YV: no exception seen whatsoever
        var tt_text = new Ext.Component( {html:el.dom.innerHTML});
        el.dom.innerHTML = "";
        comp.add(tt_text);
        var order = 0;
        var app = this.gview.m_App;
        var gview = this.gview;
        var track, tracks = app.m_Config.TrackConfig;
        var trackName = this.area.signature;
        for (i = 0; i < tracks.length; i++) {
            if (tracks[i].name == trackName) {
                track = tracks[i];
                order = track.order;
                break;
            }
        }
        if (order == 0 && trackName.match(";") ){
            var arr = [];
            arr = trackName.split(";");
            trackName = arr[0];
            for (i = 0; i < tracks.length; i++) {
                if (tracks[i].name == trackName) {
                    track = tracks[i];
                    order = track.order;
                    break;
                }
            }
        }
        if (order <= 0) return;
        var tt = this;
        if (track.check_boxes || track.choice_list) {
            this.addTool({
                id: 'gear',
                qtip: 'Modify Track Settings',
                handler: function() {
                    SeqView.pingClick('8-1');
                    tt.hide();
                    SeqView.TM.modifyTrackDetails(gview, track);
                }
            });
        }
        this.addTool({
            id: 'restore',
            qtip: 'Track standalone view',
            handler: function() {
                tt.hide();
                SeqView.pingClick('8-4');
                var tracks = [];
                Ext.each(app.m_Config.TrackConfig, function(trk) {
                    if (trk.shown && trk.id == "STD1") {
                        tracks.push(trk);
                        return false;
                    }
                });
                tracks.push(track);
                gview.m_App._getLinkToThisPageURL('full', SeqView.TM.tracksArrayToString(tracks), true);
            }
        });
        this.addTool({
            id: 'help',
            qtip: 'Track legend',
            handler: function() {
                tt.hide();
                SeqView.pingClick('8-2');
                SeqView.showHelpDlg('legends/#' + track.legend_text);
            }
        });
        this.addTool({
            id: 'close',
            qtip: 'Hide (deactivate) Track',
            handler: function() {
                tt.hide();
                track.shown = false;
                SeqView.pingClick('8-3');
                SeqView.TM.Common.updateSeqViewApp(SeqView.TM.processTracksInfo(tracks), app);
            }
       });
    },
    areaVisible: function(visible) {
        this.areaShown = visible;
    },
    showFeat: function(e,t,panel) {
        if (this.areaShown) {
            var view_start = -this.gview.m_ScrollPix;
            if (this.area.bounds.r - 10 < view_start) {
                this.gview.scrollViewTo(-(this.area.bounds.l-10), SeqView.PAN_RIGHT);
            } else  if (this.area.bounds.l+10 > this.gview.getScreenWidth() + view_start) {
                var new_pos = view_start + (this.area.bounds.r - (view_start + this.gview.getScreenWidth()));
                this.gview.scrollViewTo(-(new_pos+10), SeqView.PAN_LEFT);
            }
            this.highlightFeat();
        } else {
            this.loadAreaRange(false);
        }
        SeqView.pingClick('6-2');
    },

    highlightFeat: function() {
        var new_sel = new SeqView.SelectionHighlighter(this.gview, this.area);
        new_sel.remove.defer(900,new_sel);
    },
    loadAreaRange: function(magnify) {
        var from = this.area.range[0];
        var len = this.area.range[1] - this.area.range[0] + 1;
        var la = Math.floor(len/10);
        from -= la;
        if (from - la < 0) from = 0;
        len += 2*la;
        if (from+len-1 > this.gview.m_App.m_SeqLen)
            len -= this.gview.m_App.m_SeqLen - (from+len-1);
        if (this.gview.m_VisFromSeq != from || this.gview.m_VisLenSeq != len) {
            this.gview.startImageLoading(from, len, {from_ui: true});
            this.delayedHighlight = true;
        } else {
            this.highlightFeat();
        }
        if (magnify) SeqView.pingClick('6-3');
    },

    getMouseOffset : function(){ return this.mouseOffset; },
        // private
    highlightToolTip: function() {
        this.getEl().addClass('xsv-tooltip_highlight');
        //this.getEl().removeClass.defer(500,this.getEl(),['tooltip_highlight']);
    },
    unHighlightToolTip : function(){
        this.getEl().removeClass('xsv-tooltip_highlight');
    }

});



/* Selections highlighter */

SeqView.SelectionHighlighter = function(view, area, for_edit) {
    this.m_View = view;
    this.area = area;

    this.parent_id = this.m_View.m_DivId;
    this.parent_elem = Ext.get(this.parent_id);

    var html = '<div id="selection_id_{idx}" class="sv-drag '
    html += for_edit? ' sv-highlight selection_highlight-edit' : ' selection_highlight'
    html += '"/>'
    var tpl = new Ext.Template(html);
    this.element = tpl.append(this.parent_elem, {idx: Ext.id()/*this.m_View.m_Idx*/}, true);

    var bounds = this.area.bounds;

    var off = for_edit? 6 : 3
    var left  = Math.min(view.m_Width, (view.getFlip() ? bounds.r : bounds.l) + 1);
    var the_top = bounds.t - 6;
    var the_left  = Math.max(-view.m_Width, left + this.m_View.m_ScrollPix - 4);
    var the_width = Math.min(view.m_Width * 2, Math.abs(bounds.l - bounds.r) + 6);
    var the_height = bounds.b - bounds.t + 5;

    this.element.setLeft(the_left); // the output from cgi seems a bit off. That's why this offsets. Or is it browser-specific? :)
    this.element.setTop(the_top);
    this.element.setHeight(the_height);
    this.element.setWidth(the_width);
};

SeqView.SelectionHighlighter.prototype = {
    movePix: function(delta) {
        var new_left = this.element.getLeft(true) - delta;
        this.element.setLeft(new_left);
    },
    remove: function() {
        this.element.remove();
    }
};


SeqView.createSelectionElement = function(view, area, tpl) {
    var bounds = area.bounds;
    var parent_elem = Ext.get(view.m_DivId);
    var element = tpl.append(parent_elem, {idx: Ext.id()}, true);

    var left  = Math.max(view.m_ScrollPix, view.getFlip() ? bounds.r : bounds.l);
    var right  = Math.min(view.m_Width * 2, view.getFlip() ? bounds.l : bounds.r);
    var the_width = Math.min(view.m_Width, Math.abs(right - left)) + 2;
    var the_top = bounds.t - 3;
    var the_left  = Math.max(-view.m_Width, left + view.m_ScrollPix - 1);

    if (area.type && (area.type & SeqView.AreaFlags.Track)) {
        the_left = 0;
        the_width = parent_elem.getWidth();
    }
    if (area.tname) {
        the_top = bounds.t;
        the_width = area.tname.getComputedWidth();
    }
    element.setLeft(the_left); // the output from cgi seems a bit off. That's why this offsets. Or is it browser-specific? :)
    element.setTop(the_top);
    element.setHeight(bounds.b-bounds.t);
    element.setWidth(the_width);
    return element;
}
/* Selections */
SeqView.Selection = function(view, areas) {
    this.m_View = view;
    this.delayTimeout = null;
    this.saved_event = null;
    this.areas = areas;
    this.area = areas.length ? areas[areas.length - 1] : areas;

    var signatures = [];
    for (var i = 0; i != areas.length; i++) signatures.push( areas[i].signature );

    var tpl = (this.area.type & (SeqView.AreaFlags.NoHighlight | SeqView.AreaFlags.Track | SeqView.AreaFlags.Sequence)) !== 0 ?
            new Ext.Template('<div id="selection_id_{idx}" class="over_noselection sv-drag sv-dblclick"/>') :
            new Ext.Template('<div id="selection_id_{idx}" class="over_selection sv-drag sv-dblclick"/>');

    this.element = SeqView.createSelectionElement(view, this.area, tpl);

    // we need this complex logic for handling onClick and onDblClick events here because
    // dblclick event triggers different event sequence on different browsers:
    // on IE it is : click, dblclick
    // on others :   click, click, dblclick
    var events_handler = {
        'click':       this.clickTest,
        'contextmenu': this.onContextMenu,
        scope:         this
    };

    if (Ext.isIE) {
        events_handler['dblclick'] = this.interOnDblClick;
    }

    this.element.on(events_handler);
    var area = this.area;
    var el = this.element;
    if (area.qtip) {
        area.qtip.highlightToolTip();
        return;
    }
    if (!this.m_View.ToolTipsMgr)
        this.m_View.ToolTipsMgr = new Ext.ux.StickyToolTipsMgr();

    if (!area.tooltip) {
        if (area.type & (SeqView.AreaFlags.Sequence
                       | SeqView.AreaFlags.Ruler
                       | SeqView.AreaFlags.TooltipEmbedded)) {
            area.tooltip = "Not provided";
        }
    }

    if ( (area.type & SeqView.AreaFlags.Track) !== 0 && !area.tooltip && !area.signature.match(";") ){
        area.tooltip = this.m_View.m_App.getToolTipForTrack(this.m_View, area.signature);
    }
    if (area.tooltip) { // use from cache
        if (area.tooltip.match("Not provided")) return;
        new SeqView.SelectionToolTip({
            selection: this,
            id: 'svtt-'+ Ext.id()
            //title: this.title
        });
    } else {
        var params = null;

        if( (area.type & SeqView.AreaFlags.Track) !== 0 && area.signature.match(";") ){
            var arr = [];
            arr = area.signature.split(";");
            var gijunk = arr[1];//arr[1] is used for getting track name
            var id = [];
            id = gijunk.split("|");
            params = {signatures: id[1]};

        } else {
            params = {signatures: signatures.join(',')};
        }

        if( area.parent_id && area.parent_id.length > 0 ){
            Ext.each( this.m_View.m_App.m_Config.TrackConfig,
                function( track, ix ){
                    if( track.id == area.parent_id ){
                        var str = 'id:' + track.id;
                        str += ',' + 'key:' + track.key;
                        if( track.name && track.name.length > 0 ){
                            str += ',' + 'name:' + SeqView.escapeTrackName(track.name);
                        }
                        if( track.data_key && track.data_key.length > 0 ){
                            str += ',' + 'data_key:' + SeqView.escapeTrackName(track.data_key);
                        }
                        if( track.display_name && track.display_name.length > 0 ){
                            str += ',' + 'display_name:' + SeqView.escapeTrackName(track.display_name);
                        }
                        if( track.dbname && track.dbname.length > 0 ){
                            str += ',' + 'dbname:' + SeqView.escapeTrackName(track.dbname);
                        }
                        Ext.each( track.annots, function( annot, idx ){
                            str += idx == 0 ? ',annots:' : '|';
                            str += SeqView.escapeTrackName(annot);
                        });

                        params.track = '[' + str + ']';
                    }
                }
            );
        }
        var app = this.m_View.m_App;
        if (app.m_Key) params.key = app.m_Key;
        if (app.m_DepthLimit) params.depthlimit = app.m_DepthLimit;
        if (app.m_BamPath) params.bam_path = app.m_BamPath;
        if (app.m_SRZ) params.srz = app.m_SRZ;
        if (app.m_AssmContext) params.assm_context = app.m_AssmContext;
        params.objinfo = 1;
        params.id = app.GI;
        params.color = app.m_Config.Options.curr_color;
        var sel_tooltip = new SeqView.SelectionToolTip({
            selection: this,
            id: 'svtt-'+ Ext.id()
        });
        sel_tooltip.on('render', function() {
            sel_tooltip.body.update('<div class="loading-indicator">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Loading...</div>');
            var cfg = { url: this.m_View.m_App.m_CGIs.ObjInfo, data: params, context: this,
                    success: function(data, text, res){
                        this.checkJobStatus(data, sel_tooltip, area);
                    }
            }
            this.m_View.m_App.AjaxRequest(cfg);
        }, this);
    } // if
};


SeqView.Selection.prototype = {
    movePix: function(delta) {
        var new_left = this.element.getLeft(true) - delta;
        this.element.setLeft(new_left);
    },
    //getElement: function() { return this.element; },

    remove: function() {
        if (this.area && this.area.qtip) {
            this.area.qtip.unHighlightToolTip();
        }
        this.element.remove();
    },

    onClick: function(e) {
        if (SeqView.scrolled) {
            clearTimeout(SeqView.scrolled);
            delete SeqView.scrolled;
            return;
        }
        this.m_View.changeSelectedSig(this.area, e.ctrlKey);
    },

    onDblClick: function(e) {
        //for ruler and track names area boundaries are ignored and zoom ins are based on coordinates
        if (this.area.type & (SeqView.AreaFlags.Track | SeqView.AreaFlags.Ruler)) return;

        var range = this.area.range;
        var new_from  = (range[0] < range[1]) ? range[0] : range[1];
        var new_to    = (range[0] < range[1]) ? range[1] : range[0];
        var new_len = new_to - new_from + 1; // before offset
        var l_offset = new_len / 100 * 6;  // calc. 5% offset
        new_from -= l_offset;
        new_to += l_offset;
        new_len = new_to - new_from + 1; // after offset
        this.m_View.startImageLoading( new_from, new_len, {from_ui: true} );
    },

    fireClick: function(e) {
        clearTimeout(this.delayTimeout);
        this.delayTimeout = null;
        if (!this.DblClickHit)
            this.onClick(this.saved_event);
        this.DblClickHit = false;
        this.saved_event = null;
    },

    clickTest: function(e) {
        if (this.delayTimeout) {
            if (e.type == 'click') {
                this.DblClickHit = false;
                clearTimeout(this.delayTimeout);
                this.delayTimeout = null;
                this.saved_event.type = 'dblclick';
                this.saved_event.browserEvent = 'Event dblclick';
                this.onDblClick(this.saved_event);
                this.saved_event = null;
            }
        } else {
            if (e.type == 'click' ){
                this.saved_event = new Ext.EventObjectImpl(e);
                var that = this;
                this.delayTimeout = setTimeout(function() {that.fireClick(e);}, 400);
            }
        }
    },

    interOnDblClick: function(e) {
        this.DblClickHit = true;
        this.onDblClick(e);
    },

    onContextMenu: function(e) {
        e.stopEvent();
        var range = this.area.range;
        if (range === undefined) return;
        var seq_pos = this.area.strand == 1 ? range[0]: range[1];
        var that = this;
        var areas;
        if (this.area.signature.indexOf('fake|') == -1) areas = this.areas;
        this.m_View.showContextMenu(e.getXY(),
            function(menu, download_menu) {
                menu.add('-', {text:'Set Sequence Origin At Feature', iconCls:'xsv-origin', scope:this,
                          handler:function() { this.m_View.m_App.showOriginDlg(seq_pos);} });
                if (areas) that.addFeatureLinks(menu, seq_pos, areas[0]);
                that.addDownloadLinks(download_menu, areas);
            }
        );
    },

    addFeatureLinks: function(menu, seq_pos, area) {
        var submenuVT = new Ext.menu.Menu();
        var menuVT = menu.add('-', {text: 'Views & Tools', iconCls: 'x-tbar-loading', disabled: true, menu: submenuVT})[1];

        var addSubmenu = function(links) {
            menuVT.setIconClass('xsv-views_tools')
            if (links.length) menuVT.enable();
            
            Ext.each(links, function(l) {
                submenuVT.add({text: l.label, url: l.link, handler: function(conf) { window.open(conf.url); }});
            });
        }
        if (area.links) {
            addSubmenu(area.links);
            return;
        }
        this.m_View.m_App.AjaxRequest({
            url: this.m_View.m_App.m_CGIs.Link, context:this, data: this.createCGIParams(area.signature),
            success: function(data, txt, res) {
                var links = SeqView.decode(data);
                for (var i = 0; i < links.length; i++) {
                    var url = links[i].link;
                    for (var j = 0; j < i; j++) {
                        if (links[j].link == url) {
                            links.splice(i--, 1);
                            break;
                        }
                    }
                }
                if (this.m_View.m_App.m_Embedded !== false)
                    for (var i = 0; i < links.length; i++) links[i].link = links[i].link.replace(/^\//,(SeqView.NCBI.host_url + '/'));
                area.links = links;
                addSubmenu(links);
            }
        }); // Ext.Ajax

    },

    addDownloadLinks: function(menu, areas) {
        if (!menu) return;
        var params = this.createCGIParams();
        var val = "";
        for (var i = 0; i < areas.length; i++) {
            if (val) val += ",";
            val += areas[i].signature;
        }
        params.ids = val;
        params.link_type = "download";
        this.m_View.m_App.AjaxRequest({
            url: this.m_View.m_App.m_CGIs.Link,
            context:this, data: params,
            success: function(data, txt, res) {
                var links = SeqView.decode(data);
                var prefix = this.m_View.m_App.m_CGIs.prefix;
                for (var i = 0; i < links.length; i++) {
                    (function(url) {
                        menu.add({text:links[i].label, scope:this,
                            handler: function() {
                                var form = Ext.DomHelper.append(document.body, {
                                    tag : 'form',
                                    method : 'post',
                                    action : url
                                });
                                document.body.appendChild(form);
                                form.submit();
                                document.body.removeChild(form);
                            }
                        });
                    })(prefix + links[i].link);
                }
            }
        }); // Ext.Ajax
    },

    createCGIParams: function(signature) {
        var params = {};
        if (signature)
            params.id = signature;
        if (this.m_View.m_App.m_ViewerContext)
            params.viewer_context = this.m_View.m_App.m_ViewerContext;
        if (this.m_View.m_App.m_Key)
            params.key = this.m_View.m_App.m_Key;
        if (this.m_View.m_App.m_DepthLimit)
            params.depthlimit = this.m_View.m_App.m_DepthLimit;
        if (this.m_View.m_App.m_SRZ)
            params.srz = this.m_View.m_App.m_SRZ;
        if (this.m_View.m_App.m_BamPath)
            params.bam_path = this.m_View.m_App.m_BamPath;
        return params;
    },

    checkJobStatus: function(data, sel_tooltip, area) {
        var objs = SeqView.decode(data);
        if (objs.job_status && (objs.job_status != 'failed' || objs.job_status != 'canceled')) {
            this.m_View.m_App.AjaxRequest.defer(1000,this,
                [{url: this.m_View.m_App.m_CGIs.ObjInfo + '?job_key=' + objs.job_id,
                  context: this,
                  success: function(data, text, res) {
                      this.checkJobStatus(data, sel_tooltip, area);
                  }
                }]
            );
        } else {
            var obj = objs[0];
            var links = obj.links || [];
            var tip = obj.text || obj.error;
            if (objs.length > 1) { // multiple features
                tip += '<br>' + (objs[1].text || objs[1].error);
                links = links.concat(objs[1].links || []);
            }
            if (this.m_View.m_App.m_preprocessorTT) this.m_View.m_App.m_preprocessorTT(links);

            sel_tooltip.tooltip = this.area.tooltip = tip;

            if (obj.exts) {
                this.area.exts = obj.exts;
            }
            if (obj.title) area.title = obj.title;
            var basiclinks = '';
            var extralinks = '';
            var downloadlinks = '';
            for (var j = 0, jlen = links.length; j < jlen; j++) {
                var lnk = links[j];
                var path = (lnk.type == 'Download' ? SeqView.base_url.slice(0, -1) : SeqView.NCBI.host_url);
                var str = '<td align="right" valign="top" nowrap><b>';
                var link_name = (lnk.name && lnk.name.length>0) ? lnk.name + ': ' : '';
                str += link_name.replace(/ /g, '&nbsp;');
                str += '</b></td><td valign="top">';
                var anchor = lnk.html || '';
                if (!anchor) {
                    for (var k = 0; k < lnk.links.length; k++) {
                        var linrec = lnk.links[k];
                        var found = false;
                        for (var l = 0; l < k; l++) {
                            if (lnk.links[l].link == linrec.link){
                                found = true;
                                break;
                            }
                        }
                        if (found) continue;
    
                        if (k > 0) anchor += ',&nbsp;';
                        var label = linrec.label.replace(/ /g, '&nbsp;');
                        anchor += '<a href="'
                        if (linrec.link.search(/^https?:/i) && linrec.link.search(/^ftp:/i))
                            anchor += path + (linrec.link.charAt(0) == '/' ? '' : '/') ;

                        anchor += linrec.link + '" target="_blank">' + label + '</a>';
                    }
                }
                str += anchor + '</td>';
                switch (lnk.type) {
                    case 'Basic': basiclinks += "<tr>" + str + "</tr>"; break;
                    case 'Extra': extralinks += "<tr>" + str + "</tr>"; break;
                    case 'Download': downloadlinks += (downloadlinks ? ',&nbsp;' : '') + anchor; break;
                }
            }
/*            if (obj.unaligned_regions) {
                this.unr = obj.unaligned_regions;
                var butts = [,,,{html: ''},,{html: ''}];
                Ext.each(obj.unaligned_regions, function(unr, idx) {
                    var id = idx + '_seq_id_' + unr.se_id; //'from:' + unr.from + ',to:' + unr.to; 
                    butts[unr.label[0]] = {id: id, html: '<button id=\"' + id + '\" ext:qtip="View unaligned fragment"'
                        + 'style=" font-size: 11px; border-radius: 4px; border-width: 1px; background-color: whitesmoke;">'
                        + unr.label[0] + ' Prime</button>'};
                }); 
                this.area.primeButts  = sel_tooltip.primeButts = '<table border="0" cellpadding="0" cellspacing="0"><tbody><tr><td align="center">'
                    + butts[5].html + '</td><td align="center">' + butts[3].html + '</td></tr></tbody></table>';
         
            }*/
            if (obj.unaligned_regions) {
                this.unr = obj.unaligned_regions;
                var str = '';
                Ext.each(obj.unaligned_regions, function (unr, idx) {
                    str += '<tr><td align="right" valign="top" nowrap><b>';
                    str += unescape(unr.label) + ':&nbsp;';
                    str += '</b></td><td valign="top">';
                    str += (unr.to - unr.from);
                    if (unr.polya == true)
                        str += '&nbsp;(polyA)';
                    str += '</td></tr>';
                });
                this.area.primeButts = sel_tooltip.primeButts = '<br/><b>Unaligned Regions&nbsp;</b><table border="0" cellpadding="0" cellspacing="0"><tbody>'
                + str + '</tbody></table>';
            }
            if (basiclinks.length > 0) {
                this.area.basiclinks = sel_tooltip.basiclinks = '<table border="0" cellpadding="0" cellspacing="0"><tbody>' + basiclinks + "</tbody></table>";
            }
            if (extralinks.length > 0) {
                this.area.extralinks = sel_tooltip.extralinks = '<table border="0" cellpadding="0" cellspacing="0"><tbody>' + extralinks + "</tbody></table>";
            }
            if (downloadlinks) {
                this.area.downloadlinks = sel_tooltip.downloadlinks = "<br/><b>Download:&nbsp;</b>" + downloadlinks;
            }
            sel_tooltip.updateContent(null, sel_tooltip.body);
            if (typeof butts !== 'undefined') {
                var tt = this;
                butts.forEach(function(b, idx) {
                    var butt = document.getElementById(b.id);
                    if (!butt) return;
                    butt.onclick = function() {tt.showPrime(tt.unr[b.id[0]]);}
                });
                
            }
            
            SeqView.ping({"jsevent": "mouseover","sv-event":"Object_ToolTip"});
        }
    },
    
    showPrime: function(unr) {
        console.log(unr);
    }
};


//////Working//////////////

SeqView.SelectedRangeToolTip = Ext.extend(Ext.ToolTip, {
    dismissDelay: 0,
    autoHide: true,
    hideDelay: 0,
    showDelay: 500,
    quickShowInterval: 0,
    trackMouse: false,
    anchor: 'top',
    anchorToTarget: true,
    mouseOffset: [-13, -8], //defined in mouse actions

    header: true, //this is to later on set the title of tooltip
    title: '&nbsp;&nbsp;&nbsp;Range ToolTip',
    draggable: true,
    cls: 'SeqViewerApp',
    initComponent: function() {
        this.pinned = false;
        this.draggable = true;
        this.gview = this.selection.m_View;
        this.target = this.selection.m_tt_TargetDivId;
        this.id = this.selection.m_tt_DivId;
        this.textId = this.selection.ToolTipTextId;
        this.manager = this.gview.SelectedRangeToolTipsMgr;
        this.range = this.selection.range;

        SeqView.SelectedRangeToolTip.superclass.initComponent.call(this);
        this.addEvents({
            "pin" : true,
            "unpin" : true
        });


    },
    afterRender : function(){
        SeqView.SelectedRangeToolTip.superclass.afterRender.call(this);
        this.addTool({
            id: 'pin',
            handler: this.toggelPin,
            scope: this,
            hidden: true
        },{
            id: 'unpin',
            handler: this.toggelPin,
            scope: this
        },
        {
            id: 'search',
            handler: function() {
                if (!this.isPinned()) {
                    this.hide();
                }
                this.centerSelection();
            },
            hidden: true,
            scope: this
        },{
            id: 'magnify',
            handler: function() {
                if (!this.isPinned()) {
                    this.hide();
                }
                this.gview.startImageLoading( this.range[0], this.range[1]-this.range[0]+1, {from_ui: true} );
            },
            scope: this
        }
        );
        // posToLocal: convert backend 0-based global coordinate to
        //     local, taking into account strand and origin
        //    posToLocal: function(pos,flip) {
        var adjustedRange1=this.gview.m_App.posToLocalDisplay(this.range[0]);
        var adjustedRange2=this.gview.m_App.posToLocalDisplay(this.range[1]);
        this.rangeText = '<b>Range: ' + adjustedRange1 + ' .. ' + adjustedRange2+ '</b>';//needed for zoomin/out
        var mHeight = 22;
        var nextStep = function () {
            return mHeight += 25;
        };
        var toolbar_items = [{
            xtype: 'tbtext', text: this.rangeText, id: this.textId,
            textStyle: 'font-weight:bold;',
            style: {margin: '0px',padding:'0px'}, x: 0, y: 0, scope: this
            },{
            text: 'Zoom On Range', iconCls: 'xsv-zoom_range',
            style: {margin: '0px',padding:'0px'}, x: 0, y: 22, scope: this,
            handler: function() {
                if (!this.isPinned()) {
                    this.hide();
                    this.gview.removeRangeSelection_2(this.range);//just added
                }
                this.gview.startImageLoading( this.range[0], this.range[1]-this.range[0]+1, {from_ui: true} );
                SeqView.pingClick('5-0');
            }},{
            text:'Zoom To Sequence', iconCls: 'xsv-zoom_seq',
            style: {margin: '0px',padding:'0px'}, x: 0, y: nextStep(), scope: this,
            handler:function() {
                if (!this.isPinned()) {
                    this.hide();
                    this.gview.removeRangeSelection_2( this.range );
                }
                this.gview.zoomSeq( Math.floor( (this.range[1] + this.range[0])/2 ) );
                SeqView.pingClick('5-8');
            }},{
            text: 'Modify Range', iconCls: 'xsv-zoom_range',
            style: {margin: '0px',padding:'0px'}, x: 0, y: nextStep(), scope: this,
            handler: function() {
                if (!this.isPinned()) this.hide();
                this.modifyRange();
                SeqView.pingClick('5-1');
            }}];

        if (this.gview.m_App.mf_MultiPanel) {
            toolbar_items.push({
                text: 'Add New Panel On Range', iconCls: 'xsv-new_view',
                style: {margin: '0px',padding:'0px'}, x: 0, y: nextStep(), scope: this,
                handler: function() {
                    var view = new SeqView.Graphic(this.gview.m_App);
                    this.gview.m_App.registerView(view);

                    var from = -1, to = -1;
                    var range = this.gview.getTotalSelectedRange();
                    if (range[0] !== -1 && range[1] !== -1) {
                        from = this.range[0];
                        to   = this.range[1];
                    } else if (this.gview.m_UrlFrom) {
                        from = this.gview.m_UrlFrom;
                        to   = this.gview.m_UrlTo;
                    } else {
                        from = this.gview.m_VisFromSeq + 1;
                        to   = this.gview.m_VisFromSeq + this.gview.m_VisLenSeq;
                    }

                    if (from !== -1 && to !== -1) view.startImageLoading(from, to - from + 1);
                    if (!this.isPinned()) {
                        this.hide();
                        this.highlightSelectedTopRectangle();
                    }
                    SeqView.pingClick('5-2');
                }}
            );
        }
        var noPBlast = (this.gview.m_App.m_ViewParams['acc_type'] !== 'DNA');
        toolbar_items.push({
            text: 'Set New Marker For Selection', iconCls: 'xsv-markers',
            style: {margin: '0px',padding:'0px'}, x: 0, y: nextStep(), scope: this,
            handler: function() {
                if (this.isPinned()) this.makeUnPinned();
                this.hide();
                var l = this.gview.m_SelectedRangeSet.length;
                for (var x = 0; x < l; x++) {
                    var sel = this.gview.m_SelectedRangeSet[x];
                    if (sel[0] == this.range[0] && sel[1] == this.range[1]) this.gview.m_App.addMarker(this.gview.m_SelectedRangeSet[x]);
                }
                this.gview.removeRangeSelection_2(this.range);
                SeqView.pingClick('5-3');
            }},{
            text: 'BLAST Search (Selection)', iconCls: 'xsv-blast',
            style: {margin: '0px',padding:'0px'}, x: 0, y: nextStep(), scope: this,
            handler: function() {
                this.gview.blastSelection();
                if (!this.isPinned()) this.hide();
                SeqView.pingClick('5-4');
            }}, {
            text: 'Primer BLAST (Selection)', iconCls: 'xsv-primer', disabled: noPBlast,
            style: {margin: '0px',padding:'0px'}, x: 0, y: nextStep(), scope: this,
            handler: function() {
                this.gview.primerBlast();
                if (!this.isPinned()) this.hide();
                SeqView.pingClick('5-5');
            }},{
            text: 'Download FASTA (Selection)', iconCls: 'xsv-download-static',
            style: {margin: '0px',padding:'0px'}, x: 0, y: nextStep(), scope: this,
            handler: function() {
                this.gview.downloadData(true, "fasta", this.range);
                SeqView.pingClick('5-6');
            }},{
            text: 'Download GenBank Flat File (Selection)', iconCls: 'xsv-download-static',
            style: {margin: '0px',padding:'0px'}, x: 0, y: nextStep(), scope: this,
            handler: function() {
                this.gview.downloadData(true, "flat", this.range);
                SeqView.pingClick('5-7');
            }}
        );


        this.toolbar = new Ext.Toolbar({
            layout: 'absolute',
            items: toolbar_items
        });

        this.toolbar.width = 218;
        this.toolbar.height = mHeight;
        this.add(this.toolbar);
        this.doLayout(false,true);

        this.standardZIndex = this.getEl().getZIndex();
        this.getEl().on('click', this.onMouseClick, this);
        this.getEl().on('click', this.onMouseUp, this);

    },

    centerSelection: function () {
        var range_l = this.range[0];
        var range_r = this.range[1];
        var pos_l = this.gview.seq2Pix(range_l);
        var pos_r = this.gview.seq2Pix(range_r);
        var view_start = -this.gview.m_ScrollPix;
        var valid = true;
        if (pos_l < 0 || pos_r > 4000) {
            valid = false;
        }
        if (valid) {
            if (pos_r - 10 < view_start) {
                this.gview.scrollViewTo(-(pos_l-10), SeqView.PAN_RIGHT);
            } else  if (pos_l+10 > (this.gview.getScreenWidth() + view_start)) {
                var new_pos = pos_r - this.gview.getScreenWidth();
                this.gview.scrollViewTo(-(new_pos+10), SeqView.PAN_LEFT);
            }
        } else {
           this.gview.startImageLoading(this.range[0],this.range[1]-this.range[0]+1);
        }
    },
    modifyRange: function() {
        var adjustedRange1=this.gview.m_App.posToLocalDisplay(this.range[0]);
        var adjustedRange2=this.gview.m_App.posToLocalDisplay(this.range[1]);

        var messageRange = adjustedRange1 +':'+adjustedRange2;

        Ext.MessageBox.prompt('Modify Range', 'Enter New Range:', function(btn, text)
        {
            if (btn!='ok' || text.length==0) return;
            this.gview.m_App.handlePos(text, {
                allow_equal: true,
                ask_user: true,
                success: function(pos_range, options) {
                    if (pos_range.length !== 2) {
                        options.failure.call(options.scope, "Range required", options);
                        return;
                    }
                    this.range[0] = pos_range[0];
                    this.range[1] = pos_range[1];
                    this.selection.range[0]=this.range[0];
                    this.selection.range[1]=this.range[1];
                    this.selection.updateCoords();

                    this.adjustedRange=[this.gview.m_App.posToLocal(this.range[0]),this.gview.m_App.posToLocal(this.range[1])];
                    if (!this.gview.m_Flip) this.rangeText = '<b>Range: ' + this.adjustedRange[0] + ' .. ' + this.adjustedRange[1] + '</b>';
                    else this.rangeText = '<b>Range: ' + this.adjustedRange[1] + ' .. ' + this.adjustedRange[0] + '</b>';
                    var el = Ext.getCmp(this.textId);
                    el.setText(this.rangeText);
                },
                failure: function(err_msg, options) {
                    Ext.MessageBox.alert('Error', err_msg);
                },
                scope: this
            });
        }, this, false, messageRange);
    },
    updateToolTip: function(range,e) {
        var xy = e.getXY();
        this.range = range;
        if (!this.gview.m_Flip) this.adjustedRange=[this.range[0]-this.gview.m_App.m_Origin,this.range[1]-this.gview.m_App.m_Origin];
        else this.adjustedRange=[-this.range[1]-this.gview.m_App.m_Origin,-this.range[0]-this.gview.m_App.m_Origin];
        this.rangeText = '<b>Range: ' + this.adjustedRange[0] + ' .. ' + this.adjustedRange[1]+ '</b>';
        if (!this.isPinned() || !this.isVisible())
            this.show();

        var el = Ext.getCmp(this.textId);
        if (el) el.setText(this.rangeText);
        this.highlightSelectedTopRectangleMouseOver();
        this.dontShow = true;
        // we need to delay this code slightly so we have time to
        // move mouse into the tooltip area.

        (function(e) {
            if ( this.isInsideTootTip(e)) {
                this.clearTimer('dismiss');
                this.autoHide = false;
                this.getEl().on('mouseout', this.onMouseOut, this);
                return;
            }
            if(this.autoHide != false){
                this.delayHide();

            }
        }).defer(1500,this,[e]);

    },
    toggelPin : function(e,t,panel) {
        if (!this.pinned) {
            panel.tools.pin.show();
            panel.tools.unpin.hide();
            panel.tools.search.show();
            this.highlightSelectedTopRectangleMouseOver();
            this.fireEvent('pin', this);
            this.autoHide = false;


        } else {

            panel.tools.pin.hide();
            panel.tools.unpin.show();
            panel.tools.search.hide();
            this.fireEvent('unpin', this);
           // if (!this.selection)
           // {
                this.hide();
                this.highlightSelectedTopRectangle();
                //this.destroy();
            //}
            this.autoHide = true;
        }
        this.pinned = !this.pinned;
    },
    makePinned : function() {
        this.tools.pin.show();
        this.tools.unpin.hide();

        this.tools.search.show();

        this.fireEvent('pin', this);
        this.pinned = true;
        this.autoHide = false;
        this.hidden = false;
        //this.removehighlightSelectedTopRectangle();
        //this.highlightSelectedTopRectangleMouseOver();
    },

    makeUnPinned : function() {
        this.tools.unpin.show();
        this.tools.pin.hide();
        this.pinned = false;
        this.tools.search.hide();
        this.hide();
        this.autoHide = true;
        //this.removehighlightSelectedTopRectangle();

    },
    isPinned: function() {
        return this.pinned;
    },

   onTargetOut: function(e){
         if(this.disabled || e.within(this.target.dom, true)){
            return;
        }
        this.dontShow = true;
        // we need to delay this code slightly so we have time to
        // move mouse into the tooltip area.

        (function(e) {
            if ( this.isInsideTootTip(e)) {
                this.clearTimer('dismiss');
                this.autoHide = false;
                this.getEl().on('mouseout', this.onMouseOut, this);
                return;
            }
            if(this.autoHide != false){
                this.delayHide();

            }
        }).defer(1500,this,[e]);

        var el = Ext.get(this.id);
        this.highlightSelectedTopRectangle();
        if (el)   el.applyStyles('outline-style: none');

    },
   onTargetOver: function(e){
        delete this.dontShow;
        this.highlightSelectedTopRectangleMouseOver();
        var el = Ext.get(this.id);
         if (el && this.isPinned())
        {
            el.applyStyles('outline-style: solid;outline-color: red;outline-width: thin;');
        }
        else this.show();
        SeqView.ping({"jsevent":"mouseover","sv-event":"Range_ToolTip"});

    },

    hide: function() {
        this.dontShow = true;
        if (this.getEl() && this.getEl().dom) {

            SeqView.SelectedRangeToolTip.superclass.hide.call(this);
        }
    },
    show: function() {
        if( !this.dontShow ){
            if( this.gview.m_ContextMenu && this.gview.m_ContextMenu.isVisible() ){
                this.gview.m_ContextMenu.hide();
            }
            SeqView.SelectedRangeToolTip.superclass.show.call(this);
            //this.keepInArea();
        }
    },
    remove: function() {
        if (this.el) this.el.remove();
    },

    onEnable: function() {
        if (!this.dontShow) {
            SeqView.SelectedRangeToolTip.superclass.onEnable.call(this);
        }
    },
    areaVisible: function(visible) {
        this.areaShown = visible;
    },
    onDocMouseDown : function(e){
        if (this.pinned)
            return;
        if (!this.isInsideTootTip(e)) {
            this.hide();
        }
        //if (this.pinned)
        //    return;
        SeqView.SelectedRangeToolTip.superclass.onDocMouseDown.call(this,e);
    },
    onMouseOut : function(e) {
        if (this.pinned || this.isInsideTootTip(e)) {
            return;
        }
        this.getEl().un('mouseout', this.onMouseOut, this);
        this.autoHide = true;
        this.hide();
//        this.clearTimer('show');
//        if(this.autoHide !== false){
//            this.delayHide();
 //       }
    },
    onMouseClick : function(e) {
        if (this.manager)
            this.manager.bringToFront(this);
    },
    onMouseUp : function(e) {
        // we need this empty method here to prevent en exception
        // in case when the event came but the tooltip has already closed

    },

     onShow : function(){
        SeqView.SelectedRangeToolTip.superclass.onShow.call(this);
        if (this.manager) {
            this.manager.register(this);
            this.manager.bringToFront(this);
        }
    },
    onHide : function(){
        if (this.manager) {
            this.manager.unregister(this);
        }
        SeqView.SelectedRangeToolTip.superclass.onHide.call(this);
        //this.destroy();
    },

    onDestroy : function() {
        if (this.target) {
            this.target.un('click', this.onTargetClick, this);
        }
        var el = this.getEl();
        if (el){
            el.un('mouseout', this.onMouseOut, this);
            //el.remove();
        }
        SeqView.SelectedRangeToolTip.superclass.onDestroy.call(this);
    },
   onTargetClick : function(e) {
        this.dontShow = true;
    },
    doAutoWidth : function(adjust){
        adjust = adjust || 0;
        var bw = this.body.getTextWidth();
        if(this.title){
            var hw = this.header.child('span').getTextWidth(this.title);// + (this.closable ? 20 : 0);
            var tn = 0;
            for(var t in this.tools) { tn += 1; }
            hw += (tn-1)*15;
            bw = Math.max(bw, hw);
        }
        bw += this.getFrameWidth() + this.body.getPadding("lr") + adjust;
        this.setWidth(bw.constrain(this.minWidth, this.maxWidth));


        if(Ext.isIE7 && !this.repainted){
            this.el.repaint();
            this.repainted = true;
        }
    },
    keepInArea: function() {
        if (this.keepArea) {
            var xy = this.getEl().getXY();
            var width = this.getEl().getWidth();
            if (xy[0] + width > this.keepArea.x + this.keepArea.width)
                this.setPagePosition(xy[0]-(xy[0]+width-(this.keepArea.x + this.keepArea.width))-4 , xy[1]);
        }

    },

    // private
    addTool : function(){
        if(!this.rendered){
            if(!this.tools){
                this.tools = [];
            }
            Ext.each(arguments, function(arg){
                this.tools.push(arg);
            }, this);
            return;
        }
         // nowhere to render tools!
        if(!this[this.toolTarget]){
            return;
        }
        if(!this.ttoolTemplate){
            // initialize the global tool template on first use
            var tt = new Ext.Template(
                 '<div class="x-tool xsv-left-align x-tool-{id}">&#160;</div>'
            );
            tt.disableFormats = true;
            tt.compile();
            SeqView.SelectedRangeToolTip.prototype.ttoolTemplate = tt;
        }
        for(var i = 0, a = arguments, len = a.length; i < len; i++) {
            var tc = a[i];
            if(!this.tools[tc.id]){
                var overCls = 'x-tool-'+tc.id+'-over';
                var t = this.ttoolTemplate.insertBefore(this[this.toolTarget], tc, true);
                this.tools[tc.id] = t;
                t.enableDisplayMode('block');
                this.mon(t, 'click',  this.createToolHandler(t, tc, overCls, this));
                if(tc.on){
                    this.mon(t, tc.on);
                }
                if(tc.hidden){
                    t.hide();
                }
                if(tc.qtip){
                    if(Ext.isObject(tc.qtip)){
                        Ext.QuickTips.register(Ext.apply({
                              target: t.id
                        }, tc.qtip));
                    } else {
                        t.dom.qtip = tc.qtip;
                    }
                }
                t.addClassOnOver(overCls);
            }
        }
    },


    isInsideTootTip: function(e) {
        if (this.isVisible() && e) {
            var el = Ext.get(this.id);
            if (!el || !el.dom)
                return false;
            var x = e.getPageX();
            var y = e.getPageY();
            var tt_x_left = el.getLeft();
            var tt_x_right = el.getRight();
            var tt_y_top = el.getTop();
            var tt_y_bottom = el.getBottom();
            if (x > tt_x_left && x < tt_x_right && y < tt_y_bottom && y > tt_y_top) {
                return true;
            }
            return false;
        }
        return false;
    },
    isInsideSelectedTopRectangle: function(e) {
        var el = Ext.get(this.target);
        if (!el || !el.dom)
            return false;
        var x = e.getPageX();
        var y = e.getPageY();
        var tt_x_left = el.getLeft();
        var tt_x_right = el.getRight();
        var tt_y_top = el.getTop();
        var tt_y_bottom = el.getBottom();
        if (x > tt_x_left && x < tt_x_right && y < tt_y_bottom && y > tt_y_top) {
            return true;
        }
        return false;
    },

    highlightSelectedTopRectangleMouseOver: function() {
        var el = null;
        if (this.target) el = Ext.get(this.target);

        if (el)
        {
            el.show();
            el.animate(
            // animation control object
                {
                color: { to: '#254117' },
                backgroundColor: { to: '#254117' }
            },
                0.35,      // animation duration
                null,      // callback
                'easeOut', // easing method
                'color'    // animation type ('run','color','motion','scroll')
            );
        }
    },
    highlightSelectedTopRectangle: function() {
        var el = null;
        if (this.target) el = Ext.get(this.target);
        if (el)
        {
            el.show();
            el.animate(
                // animation control object
                    {
                    color: { to: '#95B9C7' },
                    backgroundColor: { to: '#95B9C7' }
                },
                    0.1,      // animation duration
                    null,      // callback
                    'easeOut', // easing method
                    'color'    // animation type ('run','color','motion','scroll')
                );
        }
    },
    removehighlightSelectedTopRectangle: function() {
        var el = Ext.get(this.target);
        if (el && el.isVisible) el.hide();
    }

});

//////////////////////////////////////////////////////////////////////////
SeqView.RangeSelection = function(view, range, event) {
    this.m_View = view;
    this.m_Resizing = false;
    if (!event) this.range = range;

    var parent_elem = Ext.fly(view.m_DivId);
    this.m_tt_TargetDivId = 'svtt-' + Ext.id();
    this.m_tt_DivId = 'svtt-' + Ext.id();
    this.ToolTipTextId = 'svtt-'+Ext.id();
    var TargetDiv = '<div id="' + this.m_tt_TargetDivId + '" style="height: 22px;border:none;" />';
    var RangeDiv = '<div class="range_selection sv-drag sv-highlight" style="z-index:1;">'+TargetDiv+'</div>';

    var tpl = new Ext.Template(RangeDiv);
    this.element = tpl.append(parent_elem, {}, true);
    this.m_ToolTip = null;

    this.element.on({
        'mousedown': this.onMouseDown,
        'mousemove': this.onMouseMove,
        'touchdown': this.onMouseDown,
        'touchmove': this.onMouseMove,
        'click':     this.onClick,
        scope: this
    });

     if (event /*means resizing*/) {
        var x = this.pageToViewX(range[0]);
        this.range = [x, x];
        this.mouse_offset = 0;
        this.setElementPixRange(this.range);
        this.startResizing(event);
    } else {
        this.updateCoords();
    }

    if (!this.m_View.SelectedRangeToolTipsMgr)
        this.m_View.SelectedRangeToolTipsMgr = new Ext.ux.StickyToolTipsMgr();
    var l = this.m_View.m_OrphanRangeToolTips.length;
    for (x = 0; x < l; x++)
    {
        if (this.m_View.m_OrphanRangeToolTips[x].range[0] == this.range[0] && this.m_View.m_OrphanRangeToolTips[x].range[1] == this.range[1])
        {
            var el = Ext.get(this.m_View.m_OrphanRangeToolTips[x].id);
            //getting coordinates of orphan tooltip and assigning them to newle created tooltip
            if (el){
            var x_position = el.getLeft();
            var y_position = el.getTop();
            }
            //removing orpahn tooltip
            this.m_View.m_OrphanRangeToolTips[x].makeUnPinned();
            if (this.m_View.m_OrphanRangeToolTips[x].isVisible()) this.m_View.m_OrphanRangeToolTips[x].hide();
            this.m_View.m_OrphanRangeToolTips[x].remove();
            this.m_View.m_OrphanRangeToolTips[x].destroy();

            this.m_View.m_OrphanRangeToolTips.splice(x,1);
            if (x> 0) x--;
            l = this.m_View.m_OrphanRangeToolTips.length;
            //putting new tooltip at the coordinate of orphan tooltip

            this.m_ToolTip = new SeqView.SelectedRangeToolTip({
                selection: this

            });

            //this.m_ToolTip.updateToolTip(range,null);
            if (x_position && y_position) this.m_ToolTip.showAt([x_position,y_position]);
            else this.m_ToolTip.show();
            this.m_ToolTip.makePinned();//important to do after showing the tooltip  - pins need to be rendered first
            //break;
        }
    }
    if (!event && !this.m_ToolTip) {
        this.m_ToolTip = new SeqView.SelectedRangeToolTip({
            selection: this,
            autoHide: true
        });
    }
};

SeqView.RangeSelection.prototype = {
    pageToViewX: function(x) {
        var div_xy = Ext.fly(this.m_View.m_DivId).getXY();
        return x - div_xy[0];
    },

    movePix: function(delta) {
        var new_left = this.element.getLeft(true) - delta;
        this.element.setLeft(new_left);
    },

    remove: function() {
        this.element.remove();
    },

    rangePixToSeq: function(range) {
        var view = this.m_View;
        var scp = view.m_ScrollPix;
        var over = view.getFlip() ? -0.5 : 0.5;
        var left = Math.round(view.pix2Seq(range[0]-scp, over));
        var right = Math.round(view.pix2Seq(range[1]-scp, -over));
        if (!view.getFlip())
            return [left, right];
        else
            return [right, left];
    },
       rangeSeqToPix: function(range) {
        var view = this.m_View;
        var left, right, over;
        if (!view.getFlip()) {
            over = 0.5;
            left = range[0];
            right = range[1];
        } else {
            over = - 0.5;
            left = range[1];
            right = range[0];
        }
        left = view.seq2PixScrolled(left - over);
        right = view.seq2PixScrolled(right + over);
        return [left, right];
    },

    updateCoords: function() {
        var pix_range = this.rangeSeqToPix(this.range);
        this.setElementPixRange(pix_range);
    },
    setElementPixRange: function(range) {
        var view = this.m_View;
        // For logic underneath see markers.js:updateMarkerPos
        // TODO: move this code to view
        var left = Math.max(-10000, Math.min(10000, range[0]));
        var right = Math.max(-10000, Math.min(10000, range[1]));
        var width = right - left;
        if (width > 4000) {
            var mid_view = Math.round(view.getScreenWidth() / 2);
            if (Math.abs(left - mid_view) < Math.abs(right - mid_view)) {
                right = Math.max(mid_view + 2000, Math.min(right, left + 4000));
                left = Math.max(left, right - 4000)
            } else {
                left = Math.min(mid_view - 2000, Math.max(left, right - 4000));
                right = Math.min(right, left + 4000);
            }
            width = right - left;
        }
        var el = this.element;
        el.setLeft(left);
        el.setWidth(width);
        el.setTop(view.getSelectionTop());
        el.setHeight(view.getSelectionHeight());
    },

    startResizing: function(e) {
        this.m_Resizing = true;
        var o = this;
        var onMove = function(e) {o.onMouseMove(Ext.EventObject.setEvent(e ? e : window.event));}
        var onEnd = function(e) {o.onMouseUp(Ext.EventObject.setEvent(e ? e : window.event));}
        if ('button' in e && e.button == 0) {
            this.m_DocMouseMove = document.onmousemove;
            this.m_DocMouseUp = document.onmouseup;
            document.onmousemove = onMove;
            document.onmouseup = onEnd;
        } else {
            this.m_DocTouchMove = document.ontouchmove;
            this.m_DocTouchUp = document.ontouchend;
            document.ontouchmove = onMove;
            document.ontouchend = onEnd;
        }
    },

    onClick: function(e) {
        if (e.ctrlKey) {
            e.stopEvent();
            this.m_View.removeRangeSelection(true, this);
        }
    },

    onMouseDown: function(e) {
        // if hit is close to the border, turn on resize
        var xy = e.getXY();
        var x = this.pageToViewX(xy[0]);
        var left = this.element.getLeft(true);
        var right = left + this.element.getWidth(true);
        var ld = Math.abs(x - left);
        var rd = Math.abs(x - right);
        if (ld < 5 || rd < 5) {
            e.stopEvent();
            var pix_range = this.rangeSeqToPix(this.range);
            if (ld < rd) this.range = [pix_range[1], pix_range[0]];
            else this.range = pix_range;
            this.mouse_offset = x - this.range[1];
            this.m_View.popRangeElement(this, true);
            this.startResizing(e);
        }
    },

    onMouseUp: function(e) {
        var range;
        if (this.range[0] > this.range[1])
            range = [this.range[1], this.range[0]];
        else
            range = this.range;
        this.range = this.rangePixToSeq(range);
        this.updateCoords();
        // Let view decide whether it needs this range selection
        this.m_View.addRangeSelection(this, this.range, range[1]-range[0]);
        if (this.m_Resizing) {
            Ext.fly(this.m_View.m_DivId).setStyle('cursor', 'default');
            Ext.fly(e.getTarget()).setStyle('cursor', 'default');
        }

        this.m_Resizing = false;

        if ('button' in e && e.button == 0) {
            document.onmousemove = this.m_DocMouseMove;
            document.onmouseup = this.m_DocMouseUp;
        } else {
            document.ontouchmove = this.m_DocTouchMove;
            document.ontouchend = this.m_DocTouchUp;
        }
        this.m_DocMouseMove = this.m_DocMouseUp = this.m_DocTouchMove = this.m_DocTouchUp = null;
        if (!this.m_View.getSelectedRangeSet().length){
            this.m_View.clearSelectedSig();
        }

        //if range is more then just click and wide enough then
        //update it's range
        if (!this.m_ToolTip) {
            this.m_ToolTip = new SeqView.SelectedRangeToolTip({
               selection: this,
               autoHide: true
           });
        }
        if (this.m_ToolTip) {
              var el = Ext.get(this.m_tt_TargetDivId);
              if (el) this.m_ToolTip.updateToolTip(this.range,e);
              SeqView.ping({"jsevent":"click","sv-event":"Graph_Range_Selection"});

        }
    },

    onMouseMove: function(e) {
        var xy = e.getXY();
        var x = this.pageToViewX(xy[0]);
        if (!this.m_Resizing) {
            var left = this.element.getLeft(true);
            var right = left + this.element.getWidth(true);
            var ld = Math.abs(x - left);
            var rd = Math.abs(x - right);
            if (ld < 5 || rd < 5) {
                Ext.fly(e.getTarget()).setStyle('cursor', 'e-resize');
            } else {
                Ext.fly(e.getTarget()).setStyle('cursor', 'default');
            }
            if (this.m_ToolTip && !this.m_ToolTip.isVisible()) {
                this.m_ToolTip.highlightSelectedTopRectangle();
            }
            return;
        }
        if (e.type == 'mousemove' && e.button < 0) { this.onMouseUp(e);
        } else {
            x -= this.mouse_offset;
            e.stopEvent();
            if (x == this.range[1]) return;
            this.range[1] = x;
            var left, width;
            if (this.range[0] < this.range[1]) {
                this.setElementPixRange(this.range);
            } else {
                this.setElementPixRange([this.range[1], this.range[0]]);
            }
        }
    }
};
/*  $Id: markers.js 34117 2015-11-05 18:20:29Z borodine $
 * ===========================================================================
 *
 *                            PUBLIC DOMAIN NOTICE
 *               National Center for Biotechnology Information
 *
 *  This software/database is a "United States Government Work" under the
 *  terms of the United States Copyright Act.  It was written as part of
 *  the author's official duties as a United States Government employee and
 *  thus cannot be copyrighted.  This software/database is freely available
 *  to the public for use. The National Library of Medicine and the U.S.
 *  Government have not placed any restriction on its use or reproduction.
 *
 *  Although all reasonable efforts have been taken to ensure the accuracy
 *  and reliability of the software and data, the NLM and the U.S.
 *  Government do not and cannot warrant the performance or results that
 *  may be obtained by using this software or data. The NLM and the U.S.
 *  Government disclaim all warranties, express or implied, including
 *  warranties of performance, merchantability or fitness for any particular
 *  purpose.
 *
 *  Please cite the author in any work or product based on this material.
 *
 * ===========================================================================
 *
 * Authors:  Vlad Lebedev, Maxim Didenko, Victor Joukov
 *
 * File Description: Visual markers
 *
 */

SeqView.MarkerFlags = {
    UserLock:      (1 << 0), ///< Locked by user
    SystemLock:    (1 << 1), ///< Locked by Sequence Viewer, unlockable by user
    Hollow:        (1 << 2), ///< Marker body is transparent
    PositionTitle: (1 << 3)  ///< Title is position-based and cleared if pos change
};
SeqView.MarkerNav = String.fromCharCode(171, 187);

//////////////////////////////////////////////////////////////////////
// SeqView.Marker

SeqView.Marker = (function () {
    var sm_Width = 8;

    // Coordinates are zero-based sequence position
    function constructor(minfo, range, name, flags, color) {
        this.m_MInfo = minfo;
        this.obj_coords = null;
        this.deleted = false;
        this.flags = flags;

        this.color = color || minfo.getNextColor();
        this.assignName(name ? name : minfo.suggestNextName());
        this.marker_num = minfo.m_NextMarkerNum++;

        this.span = 0;
        this.seq_pos = range[0];
        if (range[1])
            this.span = range[1] - range[0] + 1;

        this.marker_in_views = [];
        this.lines_in_views = [];
        this.addToAllViews();


    };

    constructor.getWidth = function() { return sm_Width; };

    var sm_PanoramaTmpl = new Ext.Template(
      '<div id="{id}" ext:qtip="{qtip}" class="sv-marker sv-marker_base sv-opaque67">',
      '<div style="position:absolute;top:7px;left:0px;width:16px;height:2px;clip:rect(0 16px 2px 0);background-color:{color};"></div>',
      '<div style="position:absolute;top:4px;left:1px;width:14px;height:8px;clip:rect(0 14px 8px 0);background-color:{color};"></div>',
      '<div style="position:absolute;top:3px;left:2px;width:12px;height:10px;clip:rect(0 12px 10px 0);background-color:{color};"></div>',
      '<div style="position:absolute;top:2px;left:3px;width:10px;height:12px;clip:rect(0 10px 12px 0);background-color:{color};"></div>',
      '<div style="position:absolute;top:1px;left:4px;width:8px;height:14px;clip:rect(0 8px 14px 0);background-color:{color};"></div>',
      '<div style="position:absolute;top:0px;left:7px;width:2px;height:16px;clip:rect(0 2px 16px 0);background-color:{color};"></div>',
      '<div id="{id}_line" class="marker_line sv-opaque5" style="width:1px;border-left:1px solid {color};">',
          '<div id="{id}_body" class="sv-opaque3 sv-drag sv-highlight" style="background-color:{color};position:absolute;width:100%;height:100%"></div>',
      '</div>',
      '<div ext:qtip="Locked" id="the_{id}_lock" style="display:{lock};" class="marker_locked_ov"></div></div>'
    );
    
    var sm_PanoramaRectTmpl = new Ext.Template(
      '<div id="{id}" ext:qtip="{qtip}" class="sv-marker sv-marker_base sv-opaque67">',
      '<div style="position:absolute;top:-2px;left:2px;width:13px;height:14px;background-color:{color};opacity:0.4;"></div>',
      '<div id="{id}_line" class="marker_line sv-opaque5" style="top:14px;width:1px;border-left:1px solid {color};">',
      '</div></div>'
    );
    

    var sm_GraphicTmpl = new Ext.Template(
      '<div id="{id}" class="sv-marker sv-marker_half_base" style="top:0px;">',
      '<div style="position:absolute;top:7px;left:0px;width:8px;height:2px;clip:rect(0 8px 2px 0);background-color:{color};"></div>',
      '<div style="position:absolute;top:4px;left:1px;width:7px;height:8px;clip:rect(0 7px 8px 0);background-color:{color};"></div>',
      '<div style="position:absolute;top:3px;left:2px;width:6px;height:10px;clip:rect(0 6px 10px 0);background-color:{color};"></div>',
      '<div style="position:absolute;top:2px;left:3px;width:5px;height:12px;clip:rect(0 5px 12px 0);background-color:{color};"></div>',
      '<div style="position:absolute;top:1px;left:4px;width:4px;height:14px;clip:rect(0 4px 14px 0);background-color:{color};"></div>',
      '<div style="position:absolute;top:0px;left:7px;width:1px;height:16px;clip:rect(0 1px 16px 0);background-color:{color};"></div>',
      '<div id="{id}_line" class="marker_line sv-opaque5" style="width:0px;border-left:1px solid {color};border-right:1px solid {color};">',
          '<div id="{id}_body" class="sv-opaque3 sv-drag sv-highlight" style="background-color:{color};position:absolute;width:100%;height:100%"></div>',
      '</div>',
      '<div id="the_{id}_back" class="marker_label_back sv-opaque67" style="{font_size}background-color:{color};width:{label_length}px;"></div>',
       '<div id="{id}_label" class="marker_label">{trimmed_label}',
      ' <img id="the_{id}_lock" style="margin-top:1px;display:{lock};" src="' + SeqView.base_url + 'images/lock.png"></div></div>'
    );
    
    var sm_GraphicRectTmpl = new Ext.Template(
      '<div id="{id}" class="sv-marker sv-marker_half_base" style="top:0px;">',
      '<div id="{id}_line" class="marker_line sv-opaque5" style="width:0px;border-left:1px solid {color};border-right:1px solid {color};">',
          '<div id="{id}_body" class="sv-opaque3 sv-drag sv-highlight" style="background-color:{color};position:absolute;width:100%;height:100%"></div>',
      '</div>',
      '<div id="the_{id}_back" class="marker_label_back sv-opaque67" style="{font_size}background-color:{color};opacity:0.4;top:1px;left:1px;width:12px;"></div>',
      '<div id="{id}_label" class="marker_label" style="font-size:13px;left:1px;top:0px;">' + SeqView.MarkerNav + '</div>',
      '</div>'
    );


    var sm_GraphicHollowTmpl = new Ext.Template(
      '<div id="{id}" class="sv-marker sv-marker_half_base" style="top:0px;">',
      '<div style="position:absolute;top:7px;left:0px;width:8px;height:2px;clip:rect(0 8px 2px 0);background-color:{color};"></div>',
      '<div style="position:absolute;top:4px;left:1px;width:7px;height:8px;clip:rect(0 7px 8px 0);background-color:{color};"></div>',
      '<div style="position:absolute;top:3px;left:2px;width:6px;height:10px;clip:rect(0 6px 10px 0);background-color:{color};"></div>',
      '<div style="position:absolute;top:2px;left:3px;width:5px;height:12px;clip:rect(0 5px 12px 0);background-color:{color};"></div>',
      '<div style="position:absolute;top:1px;left:4px;width:4px;height:14px;clip:rect(0 4px 14px 0);background-color:{color};"></div>',
      '<div style="position:absolute;top:0px;left:7px;width:1px;height:16px;clip:rect(0 1px 16px 0);background-color:{color};"></div>',
      '<div id="{id}_line" class="marker_line sv-opaque5" style="width:0px;border-top:5px solid {color};border-left:1px solid {color};border-right:1px solid {color};">',
          '<div id="{id}_body" class="sv-transparent sv-drag sv-highlight" style="background-color:{color};position:absolute;width:100%;height:100%"></div>',
      '</div>',
      '<div id="the_{id}_back" class="marker_label_back sv-opaque67" style="{font_size}background-color:{color};width:{label_length}px;"></div>',
      '<div id="{id}_label" class="marker_label">{trimmed_label}',
      ' <img id="the_{id}_lock" style="margin-top:1px;display:{lock};" src="' + SeqView.base_url + 'images/lock.png"></div></div>'
    );

    constructor.getTemplate = function(is_panorama, fill_bg, rect) {
        if (is_panorama) return rect ? sm_PanoramaRectTmpl : sm_PanoramaTmpl;
        if (rect) return sm_GraphicRectTmpl;
        return fill_bg ? sm_GraphicTmpl : sm_GraphicHollowTmpl;
    };

    return constructor;
}) ();


SeqView.Marker.prototype = {

    displayPos: function(forPDF) {
        var pos = forPDF ? this.seq_pos : this.seq_pos + 1;
        if (this.span) pos += ':' + (this.seq_pos + this.span);
        return pos;
    },

    displayLocalPos: function() {
        var app = this.m_MInfo.m_App;
        var pos = app.posToLocal(this.seq_pos);
        if (this.span) {
            if (app.getFlip()) {
                pos = app.posToLocalDisplay(this.seq_pos + this.span - 1) + ':' + pos;
            } else {
                pos += ':' + app.posToLocalDisplay(this.seq_pos + this.span - 1);
            }
        }
        return pos;
    },

    addToAllViews: function() {
        var app = this.m_MInfo.m_App;
        app.forEachView(function(view) { this.addToView(view); }, this);
        if (app.m_TextView)
            app.m_TextView.AddOrUpdateMarker(this); // text view
        app.fireEvent('marker_created', this);
    },

    getCreateParams: function(is_panorama, idx) {
        var elem_id = 'marker_' + idx + '_' + this.marker_num;
        var user_lock = this.flags & SeqView.MarkerFlags.UserLock;
        this.nvMarker = this.marker_name == SeqView.MarkerNav;
        return {
            template: SeqView.Marker.getTemplate(is_panorama,
                !(this.flags & SeqView.MarkerFlags.Hollow), this.nvMarker),
            options: {
                // Ext.js' qtips incorrectly handle sanitizing.
                // There is no way for qtip to literally read "&amp;" !
                //id: elem_id, qtip: this.visible_name, color: this.color,
                id: elem_id, color: this.color,
                num: this.marker_num, trimmed_label: this.marker_name_trimmed,
                label_length: user_lock ? this.marker_name_back_lock : this.marker_name_back,
                font_size: this.m_MInfo.m_App.m_Portal ? 'font-size:0.85em;' : '',
                lock: user_lock ? 'inline' : 'none', prefix: this.m_MInfo.m_App.m_CGIs.html_prefix
            }
        };
    },

    addToView: function(view) {
        if (view.isAlignment())
            return;

        var elem_id = 'marker_' + view.m_Idx + '_' + this.marker_num;

        var marker = view.createMarkerElem(this);
        this.m_MInfo.m_AllMarkers[elem_id] = this;

        var marker_line = Ext.get(elem_id + '_line');
        var marker_height = view.m_FromCgi.img_height || view.m_Height;
        marker_line.setHeight(marker_height - 18); // ball size
        // To satisfy IE pre-8
        marker.setHeight(marker_height);

        this.lines_in_views[view.m_Idx] = marker_line;
        this.marker_in_views[view.m_Idx] = marker;

        this.updateMarkerPos(view);

        var marker_label = Ext.get( elem_id + '_label' );
        if( marker_label ){
            marker_label.on({
                'mousedown': this.onMouseDown,
                'mousemove': this.onMouseMove,
                'contextmenu': this.onContextMenu,
                scope: this
            });
        }

        //creating tooltip object that targets this marker
        if (!view.MarkerToolTipsMgr)
            view.MarkerToolTipsMgr = new Ext.ux.StickyToolTipsMgr();
        if (view.m_Type == "graphical") {
            var elem_id = 'marker_' + view.m_Idx + '_' + this.marker_num + '_label';
            this.m_ToolTip = new SeqView.MarkerToolTip({
                selection: this,
                target: elem_id,
                gview: view

            });
        }

    },
    removeFromView: function(view) {
        //removing marker tooltips
        if (this.m_ToolTip) {
            this.m_ToolTip.remove();
            this.m_ToolTip.destroy();
        }
        var elem_id = 'marker_' + view.m_Idx + '_' + this.marker_num;
        if (this.marker_in_views[view.m_Idx]) {
            this.marker_in_views[view.m_Idx].remove();
            delete this.m_MInfo.m_AllMarkers[elem_id];
        }
    },

    lockMarker: function() {
        if (this.flags & SeqView.MarkerFlags.SystemLock) return;
        this.flags = this.flags ^ SeqView.MarkerFlags.UserLock;
        if (!(this.flags & SeqView.MarkerFlags.UserLock) &&
             (this.flags & SeqView.MarkerFlags.PositionTitle)) {
            this.flags = this.flags ^ SeqView.MarkerFlags.PositionTitle;
            this.rename(this.m_MInfo.suggestNextName());
        }

        // update views
        this.m_MInfo.m_App.forEachView(function(view) {
            var elem_id = 'the_marker_' + view.m_Idx + '_' + this.marker_num + '_lock';
            var back_id = 'the_marker_' + view.m_Idx + '_' + this.marker_num + '_back';
            var the_marker = Ext.get(elem_id);
            var the_back = Ext.get(back_id);

            // it's a bit tricky. Marker backgroung is transparent and the label is opaque
            // this means we have to use absolute positioning and resize the background manually to put/remove the lock icon
            if (the_marker) {
                var cur_display = the_marker.getStyle('display');
                the_marker.setStyle('display', cur_display == 'none' ? 'inline' : 'none');
                if (!view.isPanorama()) {
                    the_back.setStyle('width', '' + ((this.flags & SeqView.MarkerFlags.UserLock) ? this.marker_name_back_lock : this.marker_name_back) + 'px');
                }
            }
        }, this);

        // Text View
        if (this.m_MInfo.m_App.m_TextView)
            this.m_MInfo.m_App.m_TextView.UpdateLockMarker(this);
    },

    deleteMarker: function() {
        this.m_MInfo.m_App.forEachView(function(view) {
            this.removeFromView(view);
        }, this);

        // remove from text view
        if (this.m_MInfo.m_App.m_TextView)
            this.m_MInfo.m_App.m_TextView.RemoveMarker(this);

        this.deleted = true;
        this.m_MInfo.m_App.fireEvent('marker_deleted', this);

    },


    getMarker: function(elem_id) {
        var s = elem_id.split('_');
        view = this.m_MInfo.m_App.findView(s[1]);
        marker = this.marker_in_views[s[1]];
        return { view: view, marker: marker };
    },

    setCursor: function(elem_id, cursor) {
        this.getMarker(elem_id).marker.setStyle('cursor', cursor);
    },

    getSeqPos: function(elem_id, pix_pos) {
        var s = elem_id.split('_');
        var view = this.m_MInfo.m_App.findView(s[1]);
        if (view) {
            var pix = pix_pos - view.m_ScrollPix;
            return view.pix2Seq(pix);
        }
        return 0;
    },

    // set marker name and calculate derived names and parameters
    assignName: function(name) {
        var trimmed_name = name.trimToPix(100);
        this.marker_name = name;
        this.visible_name = SeqView.sanitize(name);
        this.marker_name_trimmed = SeqView.sanitize(trimmed_name);
        this.marker_name_back = trimmed_name.visualLength() + 2;
        this.marker_name_back_lock = this.marker_name_back + 16;
    },

    setName: function(name) {
        this.assignName(name);

        this.m_MInfo.m_App.forEachView(function(view) {
            if (view.isAlignment())
                return;

            var elem_id = 'marker_' + view.m_Idx + '_' + this.marker_num;
            var back_id = 'the_marker_' + view.m_Idx + '_' + this.marker_num + '_back';
            var elem_label_id = 'marker_' + view.m_Idx + '_' + this.marker_num + '_label';

            var marker_div = Ext.get(elem_id);
            var the_back = Ext.get(back_id);
            var marker_label_div = Ext.get(elem_label_id);
            if (marker_label_div) {// no labels in overview
                var lock_html = marker_label_div.dom.innerHTML;
                lock_html = lock_html.slice(lock_html.indexOf('<'), lock_html.length);

                marker_label_div.update(this.marker_name_trimmed + ' ' + lock_html);
                the_back.setStyle('width', '' + ((this.flags & SeqView.MarkerFlags.UserLock) ? this.marker_name_back_lock : this.marker_name_back) + 'px');
            }
        }, this);
        var marker_seq = Ext.get('seqtext-marker_' + this.m_MInfo.m_App.m_Idx + '_' + this.marker_num);
    },

    rename: function(name) {
        this.setName(name);
        //changing tooltip title too
        var title = '&nbsp;&nbsp;&nbsp;' + name;
        this.m_ToolTip.setTitle(title);
        //
        this.m_MInfo.updateInfo();
    },

    setSeqPos: function(pos, reload) {
        this.seq_pos = pos;

        this.m_MInfo.m_App.forEachView(function(view) {
            if (view.isAlignment())
                return;
            this.updateMarkerPos(view);
        }, this);

        if (reload) {
            this.m_MInfo.updateInfo();
        }

        if (reload && this.m_MInfo.m_App.m_TextView) { // text view
            this.m_MInfo.m_App.m_TextView.SetSeqPos(this);
        }
    },

    setSeqRange: function(range, reload) {
        var pos = range[0];
        if (range[1] && range[1] > pos)
            this.span = range[1] - pos + 1; // inclusive range
        else
            this.span = 0;
        this.setSeqPos(pos, reload);
    },

    setTop: function(h) { this.marker.setTop(h); },

    initMarkerMove: function(marker_id, xy) {
        this.m_CurMarker = marker_id;
        this.m_PrevXY = xy;
        var vm = this.getMarker(marker_id);
        this.m_mouseOffset = vm.marker.getLeft(true) - xy[0];
        this.setCursor(this.m_CurMarker, 'move');
    },

    moveMarker: function(xy) {
        var vm = this.getMarker(this.m_CurMarker);
        var new_left = xy[0] + this.m_mouseOffset;
        var marker_width = SeqView.Marker.getWidth();
        var flip = vm.view.getFlip && vm.view.getFlip(); // ugly, but overview does not have a getFlip
        // validate coordinate against visible window
        new_left = Math.max(-marker_width, new_left);
        var rightmost_pix = vm.view.getMostRightPix();
        var dWidth = vm.marker.getWidth() - marker_width;
        new_left = Math.min(rightmost_pix - dWidth, new_left);
        var pix = new_left + marker_width - vm.view.m_ScrollPix + ((dWidth && !this.span) ? vm.view.m_bpPix/2 : 0);
        var new_seq_pos = vm.view.pix2Seq(pix) - (flip ? this.span : 0);
        // Check new position in sequence space and fix it if possible:
        // taking into account vm.marker.getWidth() (above) takes care of this
        // approximately. Should work worse for longer sequences where
        // ration between sequence space and pixel space is higher.
        // So we adjust new_seq_pos so that both ends of marker are in
        // valid range.
        var fixed_seq_pos = Math.max(0, new_seq_pos);
        fixed_seq_pos = Math.min(vm.view.m_App.m_SeqLength - this.span, fixed_seq_pos);
        this.seq_pos = fixed_seq_pos;
        vm.marker.setLeft(new_left);
        // syncronize other markers
        this.m_MInfo.m_App.forEachView(function(view) {
            if (view.isAlignment() || view.m_Idx == vm.view.m_Idx)
                return;
            this.updateMarkerPos(view);
        }, this);

        if (this.m_MInfo.m_App.m_TextView) { // text view
            this.m_MInfo.m_App.m_TextView.AddOrUpdateMarker(this);
        }
    },

    movePix: function(elem_id, delta, validate) {
        var vm = this.getMarker(elem_id);
        var new_left = vm.marker.getLeft(true) - delta;
        var marker_width = SeqView.Marker.getWidth();
        if (validate) { // validate only when dragging with mouse
            new_left = Math.max(-marker_width, new_left);
            var rightmost_pix = vm.view.getMostRightPix();
            new_left = Math.min(rightmost_pix /* - vm.marker.getWidth() */ + marker_width, new_left);
        }
        var pix = new_left + marker_width - vm.view.m_ScrollPix;
        var flip = vm.view.getFlip && vm.view.getFlip(); // ugly, but overview does not have a getFlip
        var new_seq_pos = vm.view.pix2Seq(pix) - (flip ? this.span : 0);
        // Check new position in sequence space and fix it if possible
        var fixed_new_seq_pos = Math.max(0, new_seq_pos);
        fixed_new_seq_pos = Math.min(vm.view.m_App.m_SeqLength - this.span - 1, fixed_new_seq_pos);
        this.seq_pos = fixed_new_seq_pos;
        if (fixed_new_seq_pos !== new_seq_pos) {
            new_left = vm.view.seq2Pix(fixed_new_seq_pos);
        }
        vm.marker.setLeft(new_left);

        if (validate) { // syncronize other markers
            this.m_MInfo.m_App.forEachView(function(view) {
                if (view.isAlignment() || view.m_Idx == vm.view.m_Idx)
                    return;
                this.updateMarkerPos(view);
            }, this);

            if (this.m_MInfo.m_App.m_TextView) { // text view
                this.m_MInfo.m_App.m_TextView.AddOrUpdateMarker(this);
            }
        }
    },

    scrollPix: function(view, delta) {
        if (view.isAlignment())
            return;

        var marker = this.marker_in_views[view.m_Idx];
        var new_left = marker.getLeft(true) - delta;
        marker.setLeft(new_left);
    },

    updateMarkerSize: function(view) {
        if (view.isAlignment())
            return;
        var idx = view.m_Idx;
        var marker_line;
        if (this.lines_in_views[idx] != null) {
            marker_line = this.lines_in_views[idx];
        } else {
            this.addToView(view);
            marker_line = this.lines_in_views[idx];
        }
        marker_line.setHeight((view.m_FromCgi.img_height || view.m_Height) - 18);
    },

    updateMarkerPos: function(view) {
        if (view.isAlignment())
            return;
        var view_idx = view.m_Idx;
        var marker = this.marker_in_views[view_idx];
        var effective_pos = this.seq_pos - 0.5;
        var pix_pos = view.seq2PixScrolled(effective_pos);
        var marker_line = this.lines_in_views[view_idx];
        var end_pos = view.seq2PixScrolled((this.span || 1)  + effective_pos);
        if (end_pos < pix_pos) {
            var pos = end_pos;
            end_pos = pix_pos;
            pix_pos = pos;
        }
        var pix_width = end_pos - pix_pos;
        // small correction for visible offset
        pix_pos += 1;
        end_pos += 1;
        if (!this.span && pix_width < 9) {
            pix_pos = view.seq2PixScrolled(this.seq_pos);
            pix_width = 1;
            marker_line.setStyle("border-right", "none");
        }
        else marker_line.setStyle("border-right", "1px solid " + this.color);
        // Some browsers, WebKit-based in particular, don't like coordinates too far
        // beyond the window. We need to have an ability to hide a marker, that is why we
        // we cull coordinate by +- 10000
        pix_pos = Math.max(-10000, Math.min(10000, pix_pos - SeqView.Marker.getWidth()));
        if (pix_width > 1) {
            end_pos = Math.max(-10000, Math.min(10000, end_pos - SeqView.Marker.getWidth()));
            // Also, we should observe IE limit for width of transparent objects, ca. 4100px
            // Being on the safe side, also compatible with out image size - 4000px
            // Pick the end closest to the mid-window and adjust the other end so that
            // total width is less than 4000.
            if (end_pos - pix_pos > 4000) {
                var mid_view = Math.round(view.getScreenWidth() / 2);
                //console.log("mid_view ", mid_view);
                if (Math.abs(pix_pos - mid_view) < Math.abs(end_pos - mid_view)) {
                    end_pos = Math.max(mid_view + 2000, Math.min(end_pos, pix_pos + 4000));
                    pix_pos = Math.max(pix_pos, end_pos - 4000)
                } else {
                    pix_pos = Math.min(mid_view - 2000, Math.max(pix_pos, end_pos - 4000));
                    end_pos = Math.min(end_pos, pix_pos + 4000);
                }
            }
            pix_width = end_pos - pix_pos;
        }
        marker.setLeft(pix_pos);
        marker_line.setWidth(pix_width);
        // To satisfy IE pre-8
        if (pix_width > 1) {
            marker.setWidth(pix_width + 16);
        }


    },

    //////////////////////////////////////////////////////////////////////////
    // onMouseDown:

    onMouseDown: function(e) {
        //console.log('marker mouse down');
        if (e.button !== 0) { return; }
        if ((this.flags & (SeqView.MarkerFlags.SystemLock | SeqView.MarkerFlags.UserLock)) || Ext.fly(e.getTarget()).hasClass('sv-drag')) {
            this.m_PrevXY = null;
            this.m_CurMarker = null;
            // ignore event for locked marker and pass it to the other handlers
            return;
        }
        //hide tooltip when drugging marker

        if (this.m_ToolTip && !this.m_ToolTip.isPinned()) this.m_ToolTip.hide();
        var marker_node = Ext.fly(e.getTarget()).findParent('div.sv-marker');
        if (!marker_node) { return; }
        e.stopEvent();
        this.initMarkerMove(marker_node.id, e.getXY());
        this.m_DocMouseMove = document.onmousemove;
        this.m_DocMouseUp = document.onmouseup;
        var marker = this;
        document.onmousemove = function(e) {
            if (!e) { e = window.event; }
            e = Ext.EventObject.setEvent(e);
            marker.onMouseMove(e);
        }
        document.onmouseup = function(e) {
            if (!e) { e = window.event; }
            e = Ext.EventObject.setEvent(e);
            marker.onMouseUp(e);
        }
    },

    //////////////////////////////////////////////////////////////////////////
    // onMouseUp:

    onMouseUp: function(e) {
        if (!this.m_PrevXY || !this.m_CurMarker) { return; }
        e.stopEvent();
        this.setCursor(this.m_CurMarker, 'pointer');
        this.m_PrevXY = null;
        this.m_CurMarker = null;
        document.onmousemove = this.m_DocMouseMove;
        document.onmouseup = this.m_DocMouseUp;
        this.m_DocMouseMove = null;
        this.m_DocMouseUp = null;
        this.m_MInfo.updateInfo();

        //updating marker tooltip content
        this.m_ToolTip.updateMarkerToolTipContent(e, this.span, this.seq_pos);
    },

    //////////////////////////////////////////////////////////////////////////
    // onMouseMove:

    onMouseMove: function(e) {
        if (!this.m_PrevXY || !this.m_CurMarker) { return; }
        SeqView.ClearBrowserSelection();
        this.moveMarker(e.getXY());
    },

    //////////////////////////////////////////////////////////////////////////
    // onMouseOut:

    onMouseOut: function(e) {
        this.onMouseUp(e);
        //console.log(this);
    },

    //////////////////////////////////////////////////////////////////////////
    // onContextMenu:

    onContextMenu: function(e) {
        e.preventDefault();
        e.stopPropagation();
    },

    //////////////////////////////////////////////////////////////////////////
    // showSequence:

    showSequence: function() {
        this.m_MInfo.m_App.createTextView(this.seq_pos);
    },

    //////////////////////////////////////////////////////////////////////////
    // centerInView:

    centerInView: function(view) {
        var new_len = view.m_VisLenSeq;
        var new_from = this.seq_pos - view.m_VisLenSeq / 2;
        // Center range of marker, not its beginning if possible
        if (this.span) {
            if (this.span < new_len)
                new_from += Math.floor(this.span / 2);
            else
                new_from += view.m_VisLenSeq / 3;
        }

        if (new_from < 0) new_from = 0;
        if (new_from + new_len > view.m_App.m_SeqLength) new_len = view.m_App.m_SeqLength - new_from;
        if (new_from === view.m_VisFromSeq && new_len === view.m_VisLenSeq) return;
        view.startImageLoading(new_from, new_len);
    },

    //////////////////////////////////////////////////////////////////////////
    // zoomSeqMarker:

    zoomSeqMarker: function(view) {
        view.zoomSeq(this.seq_pos);
    }
};


/********************************************************************/
//////////////////////////////////////////////////////////////////////
// SeqView.MarkersInfo
/********************************************************************/


SeqView.MarkersInfo = (function () {

    function constructor(app) {
        this.m_App = app;
        this.m_Dlg = null;
        this.m_AllMarkers = {};
        this.m_AllMarkersRefs = [];
        this.m_MarkerColorIdx = 0;
        this.m_NextMarkerNum = 1;
    };

    constructor.deleteMarker = function(app_idx, marker_num) {
        var app = SeqView.App.findAppByIndex(app_idx);
        if (app && app.m_MarkersInfo) {
             app.m_MarkersInfo.deleteMarker(marker_num);
        }
    };

    constructor.setMarkerPosition = function(app_idx, marker_num) {
        var app = SeqView.App.findAppByIndex(app_idx);
        if (app && app.m_MarkersInfo) {
             app.m_MarkersInfo.setMarkerPosition(marker_num);
        }
    };

    constructor.renameMarker = function(app_idx, marker_num) {
        var app = SeqView.App.findAppByIndex(app_idx);
        if (app && app.m_MarkersInfo) {
             app.m_MarkersInfo.renameMarker(marker_num);
        }
    };

    return constructor;
}) ();

SeqView.MarkersInfo.prototype = {
    getNextColor: function() {
        var sm_MarkerColors = ['green', 'blue', 'red','cyan', '#FF00FF', 'black'];
        var color = sm_MarkerColors[this.m_MarkerColorIdx++];
        if (this.m_MarkerColorIdx > sm_MarkerColors.length-1)
            this.m_MarkerColorIdx = 0;
        return color;
    },

    suggestNextName: function() {
        //var name = this.m_NextMarkerNum;
        var array = this.m_AllMarkersRefs;
        var marker_nums = [];
        for (var i = 0, len = array.length; i < len; i++) {
            var m = array[i];
            if (!m.deleted) {
                var parts = m.marker_name.match(/^Marker (\d+)$/);
                if (parts != null) {
                    marker_nums.push(parts[1]);
                }
            }
        }
        marker_nums.sort(function(a,b){return a-b});
        var next_num = 1;
        for (var i = 0, len = marker_nums.length; i < len; i++) {
            if (next_num != marker_nums[i]) break;
            next_num++;
        }
        return "Marker " + next_num;
 },

//////////////////////////////////////////////////////////////////////////
// showDlg:

    showDlg: function( view ) {
        var active_marker_count = 0;
        this.forEachMarker(function() { active_marker_count++; });

        if (active_marker_count == 0) {
            this.newMarkerDlg( view );
            return;
        }
        //if (!this.m_Dlg) {
            this.m_Dlg = new Ext.Window({
                layout:'fit',
                title:'Markers',
                minWidth:480, width:600, height:350,
                cls: 'SeqViewerApp',
                constrain: true, 
                collapsible: true,
                listeners: {
                    close: {scope: this, fn: function() {
                        this.m_App.un('origin_changed', this.onOriginChanged, this);
                        this.m_App.un('strand_changed', this.onStrandChanged, this);
                    }}
                },
                tbar:[
                    { text: 'Add Marker', iconCls:'xsv-marker-add', tooltip:'Add New Marker', scope:this,
                        handler:function() {
                            this.newMarkerDlg( view );
                        }
                    },
                    '->',
                    { text:'Remove all markers', iconCls:'xsv-clear_markers', scope:this,
                        handler:function() {
                            Ext.MessageBox.confirm( 'Confirm', 'Clear all markers?', function(btn) {
                                if (btn!='yes') return;
                                this.reset();
                            },
                            this);
                        }
                    }
                ],
                closeAction:'close',
                items:[{
                    xtype:'panel', autoScroll: true, id:'marker-info-panel_' + this.m_App.m_Idx, layout:'fit',
                    autoLoad:{url:this.getMarkerInfoURL(), scope:this, callback:this.loadCallback}
                }],
                buttons: [
                    {text: 'Download', scope: this, handler: function(button) {
                        SeqView.pingClick('7-10-7-1');
                        var form = Ext.DomHelper.append(document.body, 
                            { tag : 'form', method : 'post',  action : this.getMarkerInfoURL(true) });
                        document.body.appendChild(form);
                        form.submit();
                        document.body.removeChild(form);
                    }},

                    {text: 'Close', scope: this, handler: function() { this.m_Dlg.close(); this.m_Dlg = null;} }
                ]
            });
        //}
        this.m_App.on('origin_changed', this.onOriginChanged, this);
        this.m_App.on('strand_changed', this.onStrandChanged, this);

    var app = this.m_App;
    this.m_Dlg.on( 'close', function() { app.resizeIFrame(); app.m_DialogShown = false; } );

    //tm.render( Ext.getBody() );
    app.resizeIFrame( 400 );
    app.m_DialogShown = true;
    this.m_Dlg.show();
    },

    onOriginChanged: function(app) {
        //console.log('onOriginChanged');
        this.updateInfo();

    },

    onStrandChanged: function(app) {
        if (app.getOrigin() != 0)
            this.updateInfo();
    },

//////////////////////////////////////////////////////////////////////////
// addMarker:

    addMarker: function(range, name, lock, color, flags) {
        var newMarker = new SeqView.Marker(this, range, name, lock, color, flags);
        this.m_AllMarkersRefs.push(newMarker);
        this.updateInfo();
        return newMarker;
    },

//////////////////////////////////////////////////////////////////////////
// addMarkerByData:

    addMarkerByData: function(data) {
        this.addMarker(data[0], data[1], data[2], data[3], data[4]);
    },


//////////////////////////////////////////////////////////////////////////
// newMarkerDlg:

    newMarkerDlg: function(view, pos){
        if (view) { // pos is X coordinate on the image
            pos = pos || Math.floor(view.getScreenWidth()/2);
            var seq_pos = this.m_App.posToLocalDisplay(view.pix2Seq(pos - view.m_ScrollPix));
        } else { // if pos set it's position on the sequence
            var seq_pos = pos || this.m_App.posToLocalDisplay(Math.floor(this.m_App.m_SeqLength / 2));
        }

        var mainColorDivId = Ext.id();
        var pickedcolor = this.getNextColor();
        var setMarkerDlg = new Ext.Window({
             layout:'form', modal:true, title:'Set New Marker', width:270,
             collapsible:false, constrain:true, resizable:false, closeAction:'close', iconCls:'xsv-markers',
             cls: 'SeqViewerApp',

             items:[{
                   xtype:'form',
                   bodyStyle:'padding:5px;',
                   labelWidth: 70,
                   frame:true,
                   //height: 200,
                   labelAlign:'right',
                   items:[
                      {xtype:'textfield', name:'name', width:'90%', fieldLabel:'Name', value: this.suggestNextName() },
                      {xtype:'textfield', name:'position', width:'90%', fieldLabel:'Pos/Range', value: seq_pos },
                      {
                          xtype: 'container',
                          layout: 'hbox',
                          //padding: '5',
                          //align: 'left',
                          fieldLabel: 'Color',
                          padding: 20,
                          items: [
                                  {
                                      xtype:'panel',
                                      html: '<div id="'+ mainColorDivId + '" style="width:20px;height:22px;background-color:'+ pickedcolor +';">&nbsp;&nbsp;</div>'
                                  },
                                  {
                                      xtype:'button',
                                      menu: {
                                            xtype: 'colormenu',
                                            handler: function(picker, choice) {
                                                pickedcolor = '#' + choice;
                                                var el = Ext.get(mainColorDivId);
                                                if (el) el.applyStyles('background-color:' + pickedcolor + ';');
                                            },
                                            scope: this
                                }//,anchor:'left'
                            }
                        ]
                      },
                          {xtype:'checkbox',  name:'lock', height:24, labelSeparator:'', boxLabel:'Lock Marker', checked:false }
                   ]

             }],
             buttons:[
               {text:'OK', scope:this, handler: function() {
                  values = setMarkerDlg.items.items[0].getForm().getValues();
                  name = values['name'];
                  if (name.length == 0 || name.length > 50) {
                      Ext.MessageBox.show({ title: 'Set New Marker', msg: 'Invalid marker name.',
                                            buttons:Ext.MessageBox.OK, icon:Ext.MessageBox.ERROR});
                      return;
                  }
                  this.m_App.handlePos(values['position'], {
                      ask_user: true,
                      success: function(pos_range, options) {
                          setMarkerDlg.close();
                          this.addMarker(pos_range, name, values['lock']=='on',pickedcolor);
                      },
                      failure: function(err_msg, options) {
                          Ext.MessageBox.show({title: 'Set New Marker', msg: err_msg,
                              buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.ERROR });
                      },
                      scope: this
                  });
               }},
               {text:'Cancel', handler: function() {setMarkerDlg.close(); } }
             ]
        });
        setMarkerDlg.show();
    },


    getMarkerInfoURL: function(for_download, format) {
        var url = this.m_App.m_CGIs.ObjCoords + '?objcoords=1&id=' + this.m_App.GI 
        var positions = [];
        var names = [];
        this.forEachMarker(function(m) {
            positions.push(m.seq_pos);
            names.push(m.visible_name);
            if (m.span) {
                positions.push(m.seq_pos + m.span - 1);
                names.push(m.visible_name);
            }
        });
        if (for_download) {
            url += '&download=true&fmt=' + (format ? format : 'csv');
            for (var i = 0; i < positions.length; i++) {
                url += '&pos=' + positions[i] + '&name=' + names[i];
            }
        } else {
            var sorted = positions.sort(function(a,b) { return a - b;});
            for (var i = 0, prev = sorted[0] - 1; i < sorted.length; i++) {
                if (sorted[i] != prev) url += '&pos=' + sorted[i];
                prev = sorted[i];
            }
        }
        return url;
    },


//////////////////////////////////////////////////////////////////////////
// loadCallback:

    loadCallback: function( el, success, res, options ){
        var from_cgi = Ext.decode(res.responseText);
        var formated_html = '';

        this.forEachMarker(function(m) { formated_html += this.parseObjCoords(from_cgi, m); }, this);

        if (formated_html.length == 0) { // no markers to display
            formated_html = '<div style="color:gray;margin-top:10px;" align="center">No Markers To Display</div>';
        }
        el.update(formated_html);
    },

//////////////////////////////////////////////////////////////////////////
// parseObjCoords:

    parseObjCoords: function(obj_coords_json, marker) {
        var data = obj_coords_json;
        var pos  = marker.seq_pos;
        var end_pos;
        if (marker.span)
            end_pos = pos + marker.span - 1;
        var html = '';
        var useHGVS = this.m_App.m_ViewParams.organism == "Homo sapiens";
        var cur_pos = -1;
        for (var i = 0; i != data.length; i++) {
            var row_data = data[i];
            var marker_pos = row_data['marker_pos'];
            if (marker_pos != pos  &&  marker_pos != end_pos) continue;
            if (html.length == 0) {
                html += '<table class="xsv-markerinfo" width="98%">'
                html += '<tr><th><b>Name:</b> ' + marker.visible_name;
                if (!marker.nvMarker) html += ' (<a href="#" onClick="SeqView.MarkersInfo.renameMarker('+this.m_App.m_Idx+','+marker.marker_num+');">Edit</a>)</th>';
                html += '<th width="75%" colspan=' + (useHGVS ? 4 : 3) + '>Position: ' + marker.displayPos();
                if (!marker.nvMarker) html += ' (<a href="#" onClick="SeqView.MarkersInfo.setMarkerPosition('+this.m_App.m_Idx+','+marker.marker_num+');">Edit</a>)';
                html += '<a href="#" onClick="SeqView.MarkersInfo.deleteMarker('+this.m_App.m_Idx+','+marker.marker_num+');" class="xsv-marker_remove_link">Remove</a>';
                html += '</th></tr>';
                if (useHGVS)
                    html +='<tr><th width="25%">Accession/Locus tag</th><th width="10%">Location</th><th width="10%">Relative to</th><th width="30%"><a href="http://www.hgvs.org/mutnomen" target="_blank">HGVS Name</a></th><th width="25%">Sequence</th></tr>';
                else
                    html +='<tr><th width="25%">Accession/Locus tag</th><th width="20%">Location</th><th width="10%">Relative to</th><th width="45%">Sequence</th></tr>';
            }
            html += this.addMarkersRow(row_data, useHGVS, false, cur_pos != marker_pos);
            if (cur_pos != marker_pos  &&  this.m_App.m_Origin)
                html += this.addMarkersRow(row_data, useHGVS, true);
            cur_pos = marker_pos;
        }
        html += '</table>';
        return html;
    },

    addMarkersRow: function(data, useHGVS, use_local, use_separator) {
        var pos_mapped = '';
        if (typeof(data['pos_mapped']) != 'undefined') {
            pos_mapped = data['pos_mapped'];
            if (use_local) {
                pos_mapped = this.m_App.posToLocal(pos_mapped);
            } else {
                if (pos_mapped >= 0) pos_mapped += 1;
            }
        }
        if (!useHGVS && pos_mapped.length == 0) return '';

        var html = use_separator ? '<tr class="sv-rowgroup">' : '<tr>';
        html += '<td>' + data['title'] + '</td>'; // Accession
        html += '<td>' + pos_mapped + '</td>'; // Location
        var hgvs = data['hgvs_position'];
        var rel_to = "Seq start";
        if (use_local) {
            rel_to = "Current origin";
        }
        else if (hgvs  &&  hgvs.charAt(0) == 'c') {
            rel_to = "CDS start";
        }
        html += '<td>' + rel_to + '</td>'; // Relative to
        if (useHGVS) {
            if (hgvs  &&  data['title']) {
                hgvs = data['title'] + ':' + hgvs;
            }
            html += '<td>' + hgvs + '</td>';
        }
        html += '<td><span style="font-family:monospace">' + data['sequence']+'</span></td>';
        html += '</tr>';
        return html;
    },

//////////////////////////////////////////////////////////////////////////
// updateInfo:

    updateInfo: function() {
        //console.log('updateInfo');
        var dlg = Ext.getCmp('marker-info-panel_' + this.m_App.m_Idx);
        if( dlg ){
        dlg.getUpdater().update({
        url: this.getMarkerInfoURL(),
                scope: this,
                callback: this.loadCallback
        });
    }
    },

    deleteMarker: function(num) {
        var i = this.forEachMarker(function(m) {
            if (m.marker_num == num) {
                m.deleteMarker();
                return false;
            }
        });
        if (i)
            this.updateInfo();
    },

    setMarkerPosition: function(num) {
        var m = null;
        this.forEachMarker(function(tmp) { if (tmp.marker_num == num) m = tmp; });
        if (!m) return; // marker not found

        var cur_range = m.displayLocalPos();
        var mainColorDivId = Ext.id();
        var pickedcolor = m.color;
        var setMarkerDlg = new Ext.Window({
            layout:'form', modal:true, title: m.visible_name, width:270,
            collapsible:false, constrain:true, resizable:false, closeAction:'close', iconCls:'xsv-markers',
            cls: 'SeqViewerApp',
            items:[{
                xtype:'form',
                bodyStyle:'padding:5px;align:left',
                labelWidth: 90,
                frame:true,
                labelAlign:'right',
                items: [
                    {xtype:'textfield', name: 'position', fieldLabel: 'Position/Range', value: cur_range},
                    {xtype: 'container', layout: 'hbox', fieldLabel: 'Color', padding: 5,
                        items: [
                            {xtype:'panel',
                                html: '<div id="'+ mainColorDivId + '" style="width:20px;height:22px;background-color:'+ pickedcolor +';">&nbsp;&nbsp;</div>'},
                            {xtype:'button',
                                menu: { xtype: 'colormenu',
                                    handler: function(picker, choice) {
                                        pickedcolor = '#' + choice;
                                        var el = Ext.get(mainColorDivId);
                                        if (el) el.applyStyles('background-color:' + pickedcolor + ';');
                                    },
                                    scope: this }}
                        ]
                    }
                ]
            }],
            buttons:[
                {text:'OK', scope:this,
                handler: function() {
                    values = setMarkerDlg.items.items[0].getForm().getValues();
                    this.m_App.handlePos(values['position'],
                        {allow_equal: true, ask_user: true, marker: m,
                        success: function(pos_range, options) {
                            var m = options.marker;
                            m.setSeqRange(pos_range, true);
                            setMarkerDlg.close();
                            m.m_ToolTip.updateMarkerToolTipContent(null,m.span,m.seq_pos);

                            if (m.color != pickedcolor) {
                                //destroying old marker and creating new one with new color
                                var tooltip = null;
                                var x_position, y_position;//coordinates of pinned tooltip
                                if (m.m_ToolTip.isPinned()) {
                                    tooltip = m.m_ToolTip;
                                    var el = Ext.get(tooltip.id);
                                    //getting coordinates of orphan tooltip and assigning them to newle created tooltip
                                    if (el) {
                                        x_position = el.getLeft();
                                        y_position = el.getTop();
                                    }
                                }
        
                                m.m_ToolTip.hide();
                                m.m_ToolTip.remove();
        
                                var app = m.m_MInfo.m_App;
                                app.forEachView(function(view) { m.removeFromView(view); }, m);
                                if (app.m_TextView) app.m_TextView.RemoveMarker(m); // text view
        
                                m.color = pickedcolor || m.m_MInfo.getNextColor();
        
                                app.forEachView(function(view) { m.addToView(view); }, m);
                                if (app.m_TextView) app.m_TextView.AddOrUpdateMarker(m); // text view
        
                                m.m_MInfo.updateInfo();
        
                                if (tooltip && tooltip.isPinned()){
                                    m.m_ToolTip.showAt([x_position,y_position]);
                                    m.m_ToolTip.makePinned();
                                }
                            }
                        },
                        failure: function(err_msg, options) {
                            Ext.MessageBox.show({title: 'Set Marker Position', msg: err_msg,
                                buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.ERROR });
                        },
                        scope: this
                    });
                }
            },
            { text:'Cancel', handler: function() {setMarkerDlg.close(); } }]
        });
        setMarkerDlg.show();
    },

//////////////////////////////////////////////////////////////////////////
// renameMarker:

    renameMarker: function(num) {
        var m = null;
        this.forEachMarker(function(tmp) {
            if (tmp.marker_num == num) {
                m = tmp;
            }
        });
        if (!m) return; // marker not found

        Ext.MessageBox.prompt('Marker', 'Please enter new marker name:', function(btn, text) {
            if (btn!='ok' || text.length==0) return;
            m.rename(text);
        }, this, false, m.marker_name );
    },

//////////////////////////////////////////////////////////////////////////
// reset:

    reset: function() {
        for(var m in this.m_AllMarkers) {
            if (this.m_AllMarkers[m]) {
                this.m_AllMarkers[m].deleteMarker();
            } // delete markers
        }
        this.updateInfo();
        this.m_AllMarkersRefs = [];
        this.m_MarkerColorIdx = 0;
        this.m_NextMarkerNum = 1;
    },

//////////////////////////////////////////////////////////////////////////
// updateMarkersSize:

    updateMarkersSize: function(view) {
        this.forEachMarker(function(m) { m.updateMarkerSize(view); });
    },

//////////////////////////////////////////////////////////////////////////
// updateMarkersPos:

    updateMarkersPos: function(view) {
        this.forEachMarker(function(m) {
            m.updateMarkerPos(view);
            //console.log('update MarkerPosition');
            //update marker tooltip range text content
            m.m_ToolTip.updateMarkerToolTipContent(null,this.span,this.seq_pos);
        });
    },

//////////////////////////////////////////////////////////////////////////
// scrollMarkers:

    scrollMarkers: function(view, delta) {
        this.forEachMarker(function(m) { m.scrollPix(view, delta); });
    },

//////////////////////////////////////////////////////////////////////////
// forEachMarker: call fn in scope for each marker, if return of fn is false
//   return number of marker plus one for this function and cancel execution,
//   otherwise return 0.
    forEachMarker: function(fn, scope) {
        var array = this.m_AllMarkersRefs;
        for(var i = 0, len = array.length; i < len; i++){
            var m = array[i];
            if (!m.deleted) {
                if (fn.call(scope || m, m, i, array) === false) { return (i+1); }
            }
        }
        return 0;
    },

//////////////////////////////////////////////////////////////////////////
// findMarker:

    findMarker: function(m_name) {
        return this.m_AllMarkers[m_name];
    },

//////////////////////////////////////////////////////////////////////////
// findMarkerByName:

    findMarkerByName: function(name) {
        var array = this.m_AllMarkersRefs;
        for(var i = 0, len = array.length; i < len; i++){
            var m = array[i];
            if (!m.deleted && m.marker_name == name) {
                return m;
            }
        }
        return null;
    },

//////////////////////////////////////////////////////////////////////////
// findMarkerByPos:

    findMarkerByPos: function( pos ){
        var array = this.m_AllMarkersRefs;
        for(var i = 0, len = array.length; i < len; i++){
            var m = array[i];
            if( !m.deleted && m.seq_pos == pos ){
                return m;
            }
        }
        return null;
    },

//////////////////////////////////////////////////////////////////////////
// hasMarkers:

    hasMarkers: function() {
        return this.m_AllMarkersRefs.length > 0;
    },

    parseMarkersURL: function(markers, val) {

    if( !val || val.length == 0 ){
        return;
    }

        var parts = cbSplit(val, ',');
        while (parts.length) {
            var part = parts.splice(0,1)[0];
            while (parts.length && part.charAt(part.length-1) == '\\') {
                part = part.substr(0, part.length-1) + ',' + parts.splice(0,1)[0];
            }

            var lock = false;
            var lastChar = part.charAt(part.length-1);
            if (lastChar === '!') {
                lock = true;
                part = part.substr(0, part.length-1);
            }

            var info   = part.split('|');
            var coords = info.splice(0,1)[0].split(':');
            var name   = info.splice(0,1)[0];
            while (info.length && name.charAt(name.length-1) == '\\') {
                name = name.substr(0, name.length-1) + '|' + info.splice(0,1)[0];
            }
            name = SeqView.unescapeName(name);
            var color  = info.splice(0,1)[0];
            var flags  = info.length > 0 ? parseInt(info.splice(0,1)[0]) : 0;
            if (lock) flags = flags | SeqView.MarkerFlags.UserLock;

            if( isNaN(coords[0]) ) continue;

            var range;
            var marker_pos = SeqView.stringToNum(coords[0])-1;
            if( coords.length > 1 ){
                if( isNaN(coords[1]) ) continue;

                range = [marker_pos, SeqView.stringToNum(coords[1])-1]
            } else {
                range = [marker_pos];
            }

            var colors = { red: "ff0000", green: "008000", blue: "0000ff",
                           black: "000000", cyan: "00ffff" };
            if (color && color[0] != '#') {
                if (/^[0-9a-fA-F]+$/.test(color)) {
                    color = '#' + color;
                } else if( colors[color] ){
                    color = '#' + colors[color];
                } else {
                    color = '#' + colors['green'];
                }
            }
            markers.push([range, name, flags, color]);
        }
    },

    parseMarkersOldStyle: function(markers, marker_ranges, marker_names) {
        for (var m = 0; m < marker_ranges.length; m++) {
            var val = marker_ranges[m];
            var flags = 0;
            if (val.indexOf('!') != -1) {
                flags = flags | SeqView.MarkerFlags.UserLock;
                val = val.replace(/!/, '');
            }
            var parts = val.split(':');
            var marker_pos = SeqView.stringToNum(parts[0])-1;
            var range;
            if (parts.length > 1) {
                range = [marker_pos, SeqView.stringToNum(parts[1])-1]
            } else {
                range = [marker_pos];
            }
            markers.push([range, marker_names[m], flags]);
        }
    },

//////////////////////////////////////////////////////////////////////////
// getMarkersData:
// if less_strict == true -- only symbols '|' and ',' will be "escaped"
    getMarkersData: function(less_strict, forPDF) {
        var markers = "";

        this.forEachMarker(function(m) {
            if (!m.seq_pos || isNaN(m.seq_pos) || m.nvMarker) return;
            if (markers.length > 0) markers += ',';

            markers += m.displayPos(forPDF);
            markers += "|" + SeqView.escapeName(m.marker_name, less_strict ? /([\|,])/ : false);
            markers += "|" + ((m.color.charAt(0) === '#') ? m.color.slice(1) : m.color);
            if (m.flags) markers += "|" + m.flags;
        });

        return markers;
    },

//////////////////////////////////////////////////////////////////////////
// getMarkersURL:

    getMarkersURL: function() {

        var mk_data = this.getMarkersData();
        if( mk_data && mk_data.length > 0 ){
            mk_data = '&mk=' + mk_data;
        }

        var dlg_url = '';
        if( this.m_Dlg && this.m_Dlg.isVisible() ){
            dlg_url = '&vm=true';
        }

        return mk_data + dlg_url;
    }
};

SeqView.MarkerToolTip = Ext.extend(Ext.ToolTip, {
    dismissDelay: 3000,
    hideDelay: 3000,
    autoHide: true,
    showDelay: 100,
    quickShowInterval: 0,
    trackMouse: false,
    anchor: 'top',
    anchorToTarget: true,
    header: true, //this is to later on set the title of tooltip
    trackMouse: false,
    draggable: true,
    cls: 'SeqViewerApp',
    initComponent: function() {
        this.pinned = false;
        this.draggable = true;
        this.title = '&nbsp;&nbsp;&nbsp;' + (this.selection.nvMarker ? 'Navigation Marker' : this.selection.marker_name);
        this.textId = Ext.id();
        this.manager = this.gview.MarkerToolTipsMgr;
        this.setMarkerRange(this.selection.seq_pos, this.selection.span);

        SeqView.MarkerToolTip.superclass.initComponent.call(this);

        this.addEvents({
            "pin" : true,
            "unpin" : true//,
        });

        var items = [{xtype: 'tbtext', text: this.rangeText, id: this.textId, textStyle: 'font-weight:bold;'},
                    {text: (this.selection.nvMarker ? 'Set New Marker at Position' : 'Rename...'), iconCls:'xsv-markers',
                    handler: function() {
                        if (!this.selection.nvMarker) 
                            this.selection.m_MInfo.renameMarker(this.selection.marker_num);
                        else {
                            this.selection.m_MInfo.newMarkerDlg(null, this.selection.seq_pos + 1);                            
                        }
                        SeqView.pingClick('7-10-2');
                    }}];
        if (!this.selection.nvMarker) {
            items.push(
                {text: 'Modify Position/Range/Color...', iconCls: 'xsv-zoom_range',
                handler: function() {
                    SeqView.pingClick('7-0');
                    if (!this.isPinned()) this.hide();
                    if (!(this.selection.flags & (SeqView.MarkerFlags.SystemLock | SeqView.MarkerFlags.UserLock))) {
                        this.selection.m_MInfo.setMarkerPosition(this.selection.marker_num);
                    } else 
                        Ext.Msg.alert('Information',
                            (this.selection.flags & SeqView.MarkerFlags.UserLock)
                            ? 'To modify range please first unlock the marker.'
                            : "The object is locked, can't modify range");
            }});
        }
        items.push(
            {text: 'Zoom To Sequence At Marker', iconCls:'xsv-zoom_seq',
            handler: function() {
                SeqView.pingClick('7-1', 'Marker_ToolTip');
                this.selection.zoomSeqMarker(this.gview);
                if (!this.isPinned()) this.hide();
            }},
            {text: 'Marker Details', iconCls: 'xsv-markers',
            handler: function() {
                SeqView.pingClick('7-2', 'Marker_ToolTip');
                if (!this.isPinned()) this.hide();
                this.selection.m_MInfo.showDlg(this.gview);
        }});
       

        var tooltip = this;
        var selection = this.selection;
        var app = this.selection.m_MInfo.m_App;
        var open_views_menu = new Ext.menu.Menu();
        open_views_menu.addListener('beforeshow',
            function(self) {
                self.removeAll();
                if (!app.m_Embedded) {
                    app.forEachView(function(view) {
                        if (view.isGraphic()) {
                            var range = view.toSeq();
                            var vis_range = (range[0] + 1) + '&nbsp;-&nbsp;' + (range[1] + 1);
                            var text = 'Graphical View (' + vis_range + ')';
                            var color = view.m_Color.toUpperCase(); // style names are all uppercase
                            self.add({
                                text: text, scope: this, iconCls: 'color_rect_' + color,
                                handler: function() {
                                    this.centerInView(view);
                                    SeqView.pingClick('7-10-3-1');
                                }
                            });
                        }
                    }, selection );
                    self.add('-');
                }
                self.add(
                    {text: 'Sequence View', iconCls: 'xsv-new_fasta', scope: selection,
                    handler: function() {
                        this.showSequence();
                        SeqView.pingClick('7-10-3-2');
                    }
                });
            }
        );
        
        items.push({text: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Reveal Marker in...', menu: open_views_menu});

        if (!(this.selection.flags & SeqView.MarkerFlags.SystemLock) && !this.selection.nvMarker) {
            items.push(
                {text: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Lock/Unlock Marker',
                handler: function() {
                    this.selection.lockMarker();
                    SeqView.pingClick('7-10-4');
                }
            });
        }
        items.push(
            {text: 'Remove Marker', iconCls: 'xsv-marker-remove',
            handler: function() {
                if (!this.selection.m_ToolTip.pinned) {
                    this.selection.deleteMarker();
                    this.selection.m_MInfo.updateInfo();
                    SeqView.pingClick('7-10-5');
                } else {
                    Ext.Msg.alert('Status', 'Can\'t remove marker with pinned tooltip.');
                }
            }
        });

        var scope = this;
        Ext.each(items, function(item, ix){
            item.scope = item.scope || scope; 
            item.style = {margin: '0px', padding: '0px'};
            item.x = 0;
            item.y = 20 * ix;
        });        
        this.toolbar = new Ext.Toolbar({layout: 'absolute', target: this.target, items: items,
            width: Ext.isGecko ? '205' : '180',
            height: items.length * 20 + 5});
        
        this.add(this.toolbar);
        this.addTool({
            id: 'pin',
            handler: this.toggelPin,
            scope: this,
            hidden: true
        },{
            id: 'unpin',
            handler: this.toggelPin,
            scope: this
        },
        {
            id: 'search',
            handler: function() {
                if (!this.isPinned()) this.hide();
                this.centerMarker();
            },
            hidden: true,
            scope: this
        },{
            id: 'magnify',
            handler: function() {
                this.selection.zoomSeqMarker(this.gview);
                if (!this.isPinned()) this.hide();
            },
            scope: this
        }
        );


    },
    afterRender : function(){
        SeqView.MarkerToolTip.superclass.afterRender.call(this);
        this.standardZIndex = this.getEl().getZIndex();
        this.getEl().on('click', this.onMouseClick, this);
        this.getEl().on('click', this.onMouseUp, this);

    },
    centerMarker: function () {
        var seq_end = this.selection.seq_pos + this.selection.span;
        var range_l = this.selection.seq_pos;
        var range_r = seq_end;
        //console.log('range_l='+range_l+'; range_r='+range_r);
        var pos_l = this.gview.seq2Pix(range_l);
        var pos_r = this.gview.seq2Pix(range_r);
        var view_start = -this.gview.m_ScrollPix;
        //console.log('centerSelection: pos_l='+pos_l+'; pos_r='+pos_r+'; view_start='+view_start);

        var valid = true;
        if (pos_l < 0 || pos_r > 4000) {
            valid = false;
        }
        var jj = this.gview.m_FromCgi.areas;
        if (valid) {
            if (pos_r - 10 < view_start) {
                this.gview.scrollViewTo(-(pos_l-10), SeqView.PAN_RIGHT);
            } else  if (pos_l+10 > (this.gview.getScreenWidth() + view_start)) {
                var new_pos = pos_r - this.gview.getScreenWidth();
                this.gview.scrollViewTo(-(new_pos+10), SeqView.PAN_LEFT);
            }
        } else {
            //this.gview.removeSelectionsWithNoPinnedToolTips();
           this.selection.zoomSeqMarker(this.gview);
        }
           //console.log('after: l='+l+'; r='+r+'; view_start='+view_start);
    },
    setMarkerRange: function(seq_pos, span) {
        this.adjusted_seq_pos = this.gview.m_App.posToLocal(seq_pos);
        this.adjusted_seq_end = null;
        if (span) {
            this.adjusted_seq_end = this.gview.m_App.posToLocal(seq_pos + span - 1);
            this.rangeText = '<b>Range: ';
            if (this.gview.m_App.getFlip()) {
                this.rangeText += this.adjusted_seq_end + ' .. ' + this.adjusted_seq_pos;
            } else {
                this.rangeText += this.adjusted_seq_pos + ' .. ' + this.adjusted_seq_end;
            }
            this.rangeText += '</b>';
        } else
            this.rangeText = '<b>Position: ' + this.adjusted_seq_pos + '</b>';
    },
    updateMarkerToolTipContent: function(e,span,seq_pos) {
        this.setMarkerRange(seq_pos, span);
           var el = Ext.getCmp(this.textId);
           el.setText(this.rangeText);
    },
    toggelPin : function(e,t,panel) {
        if (!this.pinned) {
            panel.tools.pin.show();
            panel.tools.unpin.hide();
            panel.tools.search.show();
            this.fireEvent('pin', this);
            this.autoHide = false;
        } else {
            panel.tools.pin.hide();
            panel.tools.unpin.show();
            panel.tools.search.hide();
            this.fireEvent('unpin', this);
            this.hide();
            this.autoHide = true;
        }
        this.pinned = !this.pinned;
    },
    makePinned : function() {
        this.tools.pin.show();
        this.tools.unpin.hide();

        this.tools.search.show();

        this.fireEvent('pin', this);
        this.pinned = true;
        this.autoHide = false;
        this.hidden = false;
    },

    makeUnPinned : function() {
        this.tools.unpin.show();
        this.tools.pin.hide();
        this.tools.search.hide();
        this.pinned = false;
        this.autoHide = true;
    },
    isPinned: function() {
        return this.pinned;
    },

   onTargetOut: function(e){
       //console.log('markers.js: onTargetOut');
    if(this.disabled || e.within(this.target.dom, true)){
            return;
        }
        this.dontShow = true;
        // we need to delay this code slightly so we have time to
        // move mouse into the tooltip area.
        (function(e) {
            if ( this.isInsideTootTip(e) ) {
                this.clearTimer('dismiss');

                this.autoHide = false;
                this.getEl().on('mouseout', this.onMouseOut, this);
                return;
            }
            if(this.autoHide !== false){
                this.delayHide();
            }
        }).defer(1500,this,[e]);
        var el = Ext.get(this.id);
         if (el)   el.applyStyles('outline-style: none');
        //if (this.pinned) this.autoHide=false;
        //else this.autoHide = true;
    },
   onTargetOver: function(e){
        //console.log('markers.js: onTargetOver');
        delete this.dontShow;

        //SeqView.MarkerToolTip.superclass.onTargetOver.call(this,e);
        //playing with anchor off set
        var el = Ext.get(this.target);
        if (el || el.dom)
        {
            if (!this.isVisible()){
            //console.log('not visible');
            var x = e.getPageX();
            var tt_x_left = el.getLeft();
            var diff = x-tt_x_left-15;
            //this.mouseOffset = [diff, 0];
            this.mouseOffset = [0, 0];
            this.show();
            }
        }

        var el = Ext.get(this.id);
         if (el && this.isPinned())
        {
            el.applyStyles('outline-style: solid;outline-color: red;outline-width:thin');
        }
        //this.autoHide=false;
        SeqView.ping({"jsevent":"mouseover", "sv-event":"Marker_ToolTip"});
    },

    hide: function() {
        this.dontShow = true;
        if (this.getEl() && this.getEl().dom) {

            SeqView.MarkerToolTip.superclass.hide.call(this);
        }
    },
    show: function() {
        if( !this.dontShow ){
            if( this.gview.m_ContextMenu && this.gview.m_ContextMenu.isVisible() ){
                this.gview.m_ContextMenu.hide();
            }
        
            SeqView.MarkerToolTip.superclass.show.call(this);
            //this.keepInArea();
        }
    },

    onEnable: function() {
        if (!this.dontShow) {
            SeqView.MarkerToolTip.superclass.onEnable.call(this);
        }
    },
    areaVisible: function(visible) {
        this.areaShown = visible;
    },
    onDocMouseDown : function(e){
        if (this.pinned)
            return;
        if (!this.isInsideTootTip(e)) {
            this.hide();
        }
        SeqView.MarkerToolTip.superclass.onDocMouseDown.call(this,e);
    },
      onMouseOut : function(e) {
        if (this.pinned || this.isInsideTootTip(e)) {
            return;
        }
        this.getEl().un('mouseout', this.onMouseOut, this);
        this.autoHide = true;
        this.clearTimer('show');
        if(this.autoHide !== false){
            this.delayHide();
        }
    },
    onMouseClick : function(e) {
        if (this.manager)
            this.manager.bringToFront(this);
    },
    onMouseUp : function(e) {
        // we need this empty method here to prevent en exception
        // in case when the event came but the tooltip has already closed
    },

     onShow : function(){
        SeqView.MarkerToolTip.superclass.onShow.call(this);
        if (this.manager) {
            this.manager.register(this);
            this.manager.bringToFront(this);
        }
    },
    onHide : function(){
        if (this.manager) {
            this.manager.unregister(this);
        }
        SeqView.MarkerToolTip.superclass.onHide.call(this);
        //this.destroy();
    },

    onDestroy : function() {
        if (this.target) {
            this.target.un('click', this.onTargetClick, this);
        }
        var el = this.getEl();
        if (el)
            el.un('mouseout', this.onMouseOut, this);
        SeqView.MarkerToolTip.superclass.onDestroy.call(this);
    },
    remove: function() {
        if( this.manager ){
            this.manager.unregister( this );
        }

        if (this.el) this.el.remove();
    },
    onTargetClick : function(e) {
        this.dontShow = true;
    },
    doAutoWidth : function(adjust){
        adjust = adjust || 0;
        var bw = this.body.getTextWidth();
        if(this.title){
            var hw = this.header.child('span').getTextWidth(this.title);// + (this.closable ? 20 : 0);
            var tn = 0;
            for(var t in this.tools) { tn += 1; }
            hw += (tn-1)*15;
            bw = Math.max(bw, hw);
        }
        bw += this.getFrameWidth() + this.body.getPadding("lr") + adjust;
        this.setWidth(bw.constrain(this.minWidth, this.maxWidth));


        if(Ext.isIE7 && !this.repainted){
            this.el.repaint();
            this.repainted = true;
        }
    },
    keepInArea: function() {
        if (this.keepArea) {
            var xy = this.getEl().getXY();
            var width = this.getEl().getWidth();
            if (xy[0] + width > this.keepArea.x + this.keepArea.width)
                this.setPagePosition(xy[0]-(xy[0]+width-(this.keepArea.x + this.keepArea.width))-4 , xy[1]);
        }

    },

    // private
    addTool : function(){
        if(!this.rendered){
            if(!this.tools){
                this.tools = [];
            }
            Ext.each(arguments, function(arg){
                this.tools.push(arg);
            }, this);
            return;
        }
         // nowhere to render tools!
        if(!this[this.toolTarget]){
            return;
        }
        if(!this.ttoolTemplate){
            // initialize the global tool template on first use
            var tt = new Ext.Template(
                 '<div class="x-tool xsv-left-align x-tool-{id}">&#160;</div>'
            );
            tt.disableFormats = true;
            tt.compile();
            SeqView.MarkerToolTip.prototype.ttoolTemplate = tt;
        }
        for(var i = 0, a = arguments, len = a.length; i < len; i++) {
            var tc = a[i];
            if(!this.tools[tc.id]){
                var overCls = 'x-tool-'+tc.id+'-over';
                var t = this.ttoolTemplate.insertBefore(this[this.toolTarget], tc, true);
                this.tools[tc.id] = t;
                t.enableDisplayMode('block');
                this.mon(t, 'click',  this.createToolHandler(t, tc, overCls, this));
                if(tc.on){
                    this.mon(t, tc.on);
                }
                if(tc.hidden){
                    t.hide();
                }
                if(tc.qtip){
                    if(Ext.isObject(tc.qtip)){
                        Ext.QuickTips.register(Ext.apply({
                              target: t.id
                        }, tc.qtip));
                    } else {
                        t.dom.qtip = tc.qtip;
                    }
                }
                t.addClassOnOver(overCls);
            }
        }
    },


    isInsideTootTip: function(e) {
        if (this.isVisible()) {
            var el = Ext.get(this.id);
            if (!el || !el.dom)
                return false;
            var x = e.getPageX();
            var y = e.getPageY();
            var tt_x_left = el.getLeft();
            var tt_x_right = el.getRight();
            var tt_y_top = el.getTop();
            var tt_y_bottom = el.getBottom();
            if (x > tt_x_left && x < tt_x_right && y < tt_y_bottom && y > tt_y_top) {
                return true;
            }
            return false;
        }
        return false;
    },

    isInsideSelectedTopRectangle: function(e) {
        var el = Ext.get(this.target);
        if (!el || !el.dom)
            return false;
        var x = e.getPageX();
        var y = e.getPageY();
        var tt_x_left = el.getLeft();
        var tt_x_right = el.getRight();
        var tt_y_top = el.getTop();
        var tt_y_bottom = el.getBottom();
        if (x > tt_x_left && x < tt_x_right && y < tt_y_bottom && y > tt_y_top) {
            return true;
        }
        return false;

    },

    highlightSelectedTopRectangleMouseOver: function() {
        var el = Ext.get(this.target);
        if (el)
        {
            el.show();
            el.animate(
            // animation control object
                {
                color: { to: '#254117' },
                backgroundColor: { to: '#254117' }
            },
                0.35,      // animation duration
                null,      // callback
                'easeOut', // easing method
                'color'    // animation type ('run','color','motion','scroll')
            );
        }
    },
    highlightSelectedTopRectangle: function() {
        var el = Ext.get(this.target);
        if (el)
        {
            el.show();
            el.animate(
            // animation control object
                {
                color: { to: '#95B9C7' },
                backgroundColor: { to: '#95B9C7' }
            },
                0.1,      // animation duration
                null,      // callback
                'easeOut', // easing method
                'color'    // animation type ('run','color','motion','scroll')
            );
        }
    },
    removehighlightSelectedTopRectangle: function() {
        var el = Ext.get(this.target);
        if (el && el.isVisible) el.hide();
    }

});
/*  $Id: view.js 34136 2015-11-09 22:16:16Z borodine $
 * ===========================================================================
 *
 *                            PUBLIC DOMAIN NOTICE
 *               National Center for Biotechnology Information
 *
 *  This software/database is a "United States Government Work" under the
 *  terms of the United States Copyright Act.  It was written as part of
 *  the author's official duties as a United States Government employee and
 *  thus cannot be copyrighted.  This software/database is freely available
 *  to the public for use. The National Library of Medicine and the U.S.
 *  Government have not placed any restriction on its use or reproduction.
 *
 *  Although all reasonable efforts have been taken to ensure the accuracy
 *  and reliability of the software and data, the NLM and the U.S.
 *  Government do not and cannot warrant the performance or results that
 *  may be obtained by using this software or data. The NLM and the U.S.
 *  Government disclaim all warranties, express or implied, including
 *  warranties of performance, merchantability or fitness for any particular
 *  purpose.
 *
 *  Please cite the author in any work or product based on this material.
 *
 * ===========================================================================
 *
 * Authors:  Vlad Lebedev, Maxim Didenko
 *
 * File Description:
 *
 */

SeqView.colorBarTPL = new Ext.Template('<div id="view_color_{idx}" style="width:15px;height:15px;background-color:#{color};border:1px black solid;">&nbsp;</div>');

SeqView.View = (function() {
    var sm_NextViewIdx = 0;
    var sm_SpacerHeight = 4;

    function constructor(type, app) {
        this.clear();
        this.m_Type =     type;
        this.m_App =      app;
        this.m_Idx =      sm_NextViewIdx++;
    }

    constructor.getSpacerHeight = function() { return sm_SpacerHeight; }

    return constructor;
}) ();

SeqView.View.prototype = {

    //seq2Pix: function(seq_pos) {
    //},

    getWidth: function() {
        return this.m_Width;
    },
    getHeight: function() {
        return this.m_Height;
    },
    isPanorama: function() {
        return false;
    },
    isGraphic: function() {
        return false;
    },
    isAlignment: function() {
        return false;
    },

    getMostRightPix: function() {
        return 0;
    },

    getScreenWidth: function() { return this.m_View.getInnerWidth() - 2; },
    getXY: function() { return this.m_View.getEl().getXY(); },

    createChooseColorBtn: function() {
        var cur_color;
        var m_ncbi_app = this.m_App.m_ncbi_app;
        if (!this.m_Color || this.m_Color.length == 0) {
            var cp = new Ext.ColorPalette();
            cur_color = cp.colors[Math.round( Math.random() * cp.colors.length)];
            this.m_Color = cur_color;
        } else {
            cur_color = this.m_Color;
        }
        return {
                text:SeqView.colorBarTPL.apply({idx:this.m_Idx, color:cur_color}),
                tooltip:'View Color',
                handler: function() {SeqView.pingClick('1-2-0');},
                menu:new Ext.menu.ColorMenu({listeners: {'select': function(cm, color) {
                    Ext.get('view_color_'+this.m_Idx).setStyle('background-color', '#'+color);
                    this.m_Color = color;
                    if (this.m_Locator) { this.m_Locator.setColor(color); }
                    this.m_App.reCreateReflections();
                },scope:this}})
        };
    },

    createCloseTBar: function() {
        return  {
            id:'close', qtip:'Close View', scope:this,
            handler:function(e, target, panel) {
                this.m_App.viewIsClosing(this);
                var view = panel.view;
                if(view) { view.remove(); }
            }
        };
    },

//////////////////////////////////////////////////////////////////////////
// clear:
    clear: function() {
        this.m_Loading =  false;
        this.m_Theme =    null;
        this.m_TopOffset = 0;
        this.m_ScrollPix = 0;
        this.m_DivId =    null;
        this.m_FromCgi =  null;
        this.m_View =     null;
        this.m_Width = 0;
        this.m_Height = 0;
        this.m_Color =  null,//0xFFFFFF,
        this.m_Spacer = null,
        this.m_Locator = null;
    },

//////////////////////////////////////////////////////////////////////////
// destroy:
    destroy: function() {
        if (this.m_Locator) {
            this.m_Locator.remove();
        }
        if(this.m_View) {
            if (this.m_Spacer) {
                this.m_View.ownerCt.remove(this.m_Spacer, true);
            }
            this.m_View.ownerCt.remove(this.m_View, true);
        }
        this.clear();
    },
//////////////////////////////////////////////////////////////////////////
// remove:

    remove: function() {
        this.destroy();
        this.m_App.removeView(this);
    },

//////////////////////////////////////////////////////////////////////////
// updateTitle:

    updateTitle: function() {
    },

//////////////////////////////////////////////////////////////////////////
// refresh:

    refresh: function() {
    },

    addURLParams: function(params) {
        var app = this.m_App;
        params = params || {};
        if (app.m_NAA) params.naa = app.m_NAA;
        if (app.m_BamPath) params.bam_path = app.m_BamPath;
        if (app.m_SRZ) params.srz = app.m_SRZ;
        if (app.m_Key) params.key = app.m_Key;
        if (app.m_Origin != 0 ) params.origin = app.m_Origin;
        if (app.m_DepthLimit) params.depthlimit = app.m_DepthLimit;
        if (app.m_AssmContext) params.assm_context = app.m_AssmContext;

        if (app.m_Config) {
            Ext.apply(params, app.m_Config.visualOptionsUrl())
        }
        if (this.isGraphic()) {
            var sm = this.m_slimMode ? ',show_title:false' : '';
            var noParallel =  (params.select && params.select.indexOf(';gi') > 0) && (app.m_hiddenOptions.indexOf('always_parallel') < 0);
            if (params.forPDF || noParallel /*(params.select && params.select.indexOf(';gi') > 0)*/)
                params.tracks = SeqView.TM.tracksArrayToString(app.getActiveTracks(), true, params.forPDF, sm);
            else
                params.tracks = SeqView.TM.tracksToArrayOfStrings(app.getActiveTracks(), sm);
            if (app.m_ViewLabels) params.markers = app.m_ViewLabels;
            if (app.m_SnpFilter) params.snp_filter = app.m_SnpFilter;
        }
        return params;
    },    

    isLoading: function() { return this.m_Loading; },
    moveTo: function(vis_from, vis_len){}
};
/*  $Id: panorama.js 33931 2015-10-01 21:36:03Z borodine $
 * ===========================================================================
 *
 *                            PUBLIC DOMAIN NOTICE
 *               National Center for Biotechnology Information
 *
 *  This software/database is a "United States Government Work" under the
 *  terms of the United States Copyright Act.  It was written as part of
 *  the author's official duties as a United States Government employee and
 *  thus cannot be copyrighted.  This software/database is freely available
 *  to the public for use. The National Library of Medicine and the U.S.
 *  Government have not placed any restriction on its use or reproduction.
 *
 *  Although all reasonable efforts have been taken to ensure the accuracy
 *  and reliability of the software and data, the NLM and the U.S.
 *  Government do not and cannot warrant the performance or results that
 *  may be obtained by using this software or data. The NLM and the U.S.
 *  Government disclaim all warranties, express or implied, including
 *  warranties of performance, merchantability or fitness for any particular
 *  purpose.
 *
 *  Please cite the author in any work or product based on this material.
 *
 * ===========================================================================
 *
 * Authors:  Vlad Lebedev, Maxim Didenko
 *
 * File Description:
 *
 */
 

/********************************************************************/
//////////////////////////////////////////////////////////////////////
// SeqView.Panorama 
/********************************************************************/

SeqView.Panorama = (function() { 
    var sm_HolderSize = 18;

    return Ext.extend(SeqView.View, {
    m_PrevXY: null,
    m_CurLocator: null,
    m_ActionNeeded: false,

//////////////////////////////////////////////////////////////////////////
// constructor:
    
    constructor: function(app) {
        SeqView.Panorama.superclass.constructor.apply(this, ['panorama', app]);
        this.m_TopOffset = sm_HolderSize;
        var pID = Ext.id();
        this.m_DivId = 'panorama_id_' + pID;
        this.m_selectionDivId = 'panorama_selection_' + pID;
        this.m_View = this.m_App.addView({ 
            html:'<div id="'+this.m_DivId+'" class="panorama_div"><div id="'+ this.m_selectionDivId + '" class="panoramaSelection" ></div><div id="pan-holder" class="pan-holder"/>'
        });
        Ext.get(this.m_DivId).on({
            'mousedown':    this.onMouseDown,
            'mouseup':      this.onMouseUp,
            'mousemove':    this.onMouseMove,
            'touchstart':   this.onMouseDown,
            'touchend':     this.onMouseUp,
            'touchmove':    this.onMouseMove,
            'contextmenu':  this.onContextMenu,
            scope: this
        });
        //if  embedded=panorama then do not allow selection
        if (!this.m_App.m_AllViewParams.match("embedded=panorama")) 
            this.m_PanoramaSelection = new SeqView.PanoramaSelection(this.m_DivId,this.m_selectionDivId, [0,0]);
        
    },
    isPanorama: function() {
        return true;
    },

    loadImage: function() {
        this.m_Width = this.getScreenWidth();
        if (this.m_Width == -2) {
            // the view is hidden, don't do anything now.
            // the client will have to call refresh method to load the image
            return;
        }
        this.m_Loading = true; // start loading
      
        var url = this.m_App.m_CGIs.Panorama;
        var params = {theme:'NCBI Overview', id: this.m_App.GI, width: this.m_Width};
        Ext.apply(params, this.m_App.m_GraphicExtraParams);
        this.addURLParams(params);
      
        this.m_App.AjaxRequest({url: url, context: this, data: params,
                    success:this.checkJobStatus, error:this.loadFailure});      
    }, 
    
    checkJobStatus: function(data, text, res) {
        var from_cgi = SeqView.decode(data);
        if (from_cgi.job_status) {
            if (from_cgi.job_status == 'failed') {
                this.loadFailure(null, from_cgi.error_message);
            } else if(from_cgi.job_status == 'canceled') {
                this.loadFailure(null, 'Job canceled');
            } else {
                var url = this.m_App.m_CGIs.Panorama + '?job_key=' + from_cgi.job_id
                this.m_App.AjaxRequest.defer(2000,this,[{url: url, context: this,
                        success: this.checkJobStatus, error: this.loadFailure}]);
            }
        } else {
            if (from_cgi.success === false) {
                this.loadFailure(null, from_cgi.msg);
            } else {
                // If the img_url begins with ? it contains only parameters for ncfetch, so prepend ncfetch URL
                // This is a way to provide reliable URL resolution for embedding. SV-1760
                if (from_cgi.img_url && from_cgi.img_url.charAt(0) == '?') {
                    from_cgi.img_url = this.m_App.m_CGIs.NetCache + from_cgi.img_url;
                }
                this.m_FromCgi = from_cgi;
                this.m_Height = this.m_FromCgi.img_height + sm_HolderSize + 1;
    
                var the_div = Ext.get(this.m_DivId);
                var img_el = the_div.first('img');
                if (img_el) {
                    var d = Ext.getDom(img_el);
                    d.src = from_cgi.img_url;
                } else {
                    var tpl = new Ext.Template('<img src="{img_url}">'),
                    img_el = tpl.append(the_div, from_cgi,true);
                }
                the_div.setStyle('height', this.m_Height+'px' ); 
                this.m_View.setHeight(this.m_Height + 2);
                         
                this.m_App.updateMarkersSize(this); // update markers
                this.m_App.updateMarkersPos(this); // update markers
                this.m_Loading = false; // loaded
                this.m_App.notifyViewLoaded(this);

                if( !this.m_App.m_DialogShown ){
                    this.m_App.resizeIFrame();
                }
            }
        }
    },
    loadFailure: function(data, text, res) {
        Ext.MessageBox.show({title:'Image loading error', msg: text, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.INFO});
    },


    toPix: function(x) { // sequence 2 screen (panorama)
        return x * this.m_Width / this.m_App.m_SeqLength;
    },

    toSeq: function(x) { 
        return Math.round(this.m_App.m_SeqLength * x / this.m_Width);
    },
    
    seq2Pix: function(seq_pos) {
        return this.toPix(seq_pos);
    },
    
    seq2PixScrolled: function(seq_pos) {
        // For panorama m_ScrollPix is always zero, but anyway
        return this.seq2Pix(seq_pos) + this.m_ScrollPix;
    },

    pix2Seq: function(pix_pos) { // screen 2 sequence (gview)
        return this.toSeq(pix_pos);
    },

    refresh: function() {
        this.loadImage();
    },

    getMostRightPix: function() {
        return this.getWidth();
    },
    
    onMouseDown: function(e) {
        if (this.m_ContextMenu) this.m_ContextMenu.destroy();
        if (e.type == 'mousedown' && e.button) return
        var tID = e.target.id;
        if (this.m_PanoramaSelection && tID.search('scroller') < 0 && tID.search('resizer') < 0){
            this.m_ResizeAction = true;
            this.m_XY = e.getXY();
            if (e.type != 'mousedown') {
                this.m_deferredContext = this.onContextMenu.defer(2000, this, null);
            } else this.m_deferredContext = 0;
            this.m_XFinal_Selection = this.m_XY[0] + 1;
            this.m_PanoramaSelection.resize(this.m_XY[0], this.m_XFinal_Selection);
            var el =  Ext.get(this.m_selectionDivId);
           if (el) el.applyStyles("display:inline;");
           e.stopEvent();
        }
    },

    onMouseMove: function(e) {
        var majicSensivity = 5; 
        if (!this.m_ResizeAction || !this.m_PanoramaSelection) return;
        var xy = e.getXY();
        if (this.m_deferredContext) {
            if (Math.abs(xy[0] - this.m_XY[0]) <= majicSensivity) return;   
            clearTimeout(this.m_deferredContext);
            this.m_deferredContext = 0;
        }
        this.m_XFinal_Selection = xy[0];
        this.m_PanoramaSelection.resize(this.m_XY[0], xy[0]);
        this.m_Selection = true;
        e.stopEvent();
    },

    onMouseUp: function(e) {
        var el =  Ext.get(this.m_selectionDivId);
        if (!el || !el.isDisplayed() || !this.m_PanoramaSelection) return;
        if (this.m_deferredContext) {   
            clearTimeout(this.m_deferredContext);
            this.m_deferredContext = 0;
        }
        this.m_ResizeAction = false;
        if (Math.abs(this.m_XFinal_Selection - this.m_XY[0]) < 5) {
            el.applyStyles("display:none;");
            return;
        } else {
            if(this.m_App.m_Views[1]){
                var m_Locator = this.m_App.m_Views[1].m_Locator;
                m_Locator.setLeft(el.getLeft() - Ext.get(this.m_DivId).getLeft());
                m_Locator.setWidth(el.getWidth());
                m_Locator.m_View.syncToLocator();
                el.applyStyles("width:0px;display:none;");
                SeqView.pingClick('1-0-1', 'Panorama_Range_Selection');
            }
        }
        e.stopPropagation();
    },

    onClick: function(e) {
        var el =  Ext.get(this.m_selectionDivId);
        el.setWidth(0);
        el.hide();
        this.m_ResizeAction = false;
        
    },

    onContextMenu: function(e) {
        var menu = new Ext.menu.Menu();
        if (this.m_deferredContext) {
            clearTimeout(this.m_deferredContext);
            this.m_deferredContext = 0;
            this.m_ContextMenu = menu;
        } else {
            this.m_XY = e.xy;
            e.preventDefault();  // this prevents the default contextmenu to open in Firefox (linux)
            e.stopPropagation();
        }
        
        SeqView.pingClick('1-1', 'Panorama_Context_Menu');      
        var x_pos = this.m_XY[0] - Ext.get(this.m_DivId).getX()
        menu.add({text:'Set New Marker At Position', iconCls:'xsv-markers', scope:this,  
                handler:function() { this.m_App.newMarkerDlg(this, x_pos); SeqView.pingClick('1-1-1');} 
        });
        menu.add('-');
        if (this.m_App.m_Origin) {
            menu.add({text:'Reset Sequence Origin', iconCls:'xsv-origin', scope:this, 
                handler:function() { this.m_App.clearOrigin(); SeqView.pingClick('1-1-2'); }
            });
        } else {
            menu.add({text:'Set Sequence Origin At Position', iconCls:'xsv-origin', scope:this, 
                handler:function() { this.m_App.setOrigin(this, x_pos); SeqView.pingClick('1-1-2'); }
            });
        }
        var nvMarker = this.m_App.getMarkersInfo().findMarkerByName(SeqView.MarkerNav);
        if (nvMarker) {
            menu.add({text:'Remove Navigation Marker', iconCls: 'xsv-marker-remove', scope:this,  
                handler:function() { nvMarker.deleteMarker(); SeqView.pingClick('1-1-3'); }
            });
        }
        if (menu.items.length>0) { menu.showAt(this.m_XY); }
    },
    
    onResize: function(e) {},
    
    createMarkerElem: function(marker) {
        var elem = Ext.get(this.m_DivId);
        var create_params = marker.getCreateParams(true,this.m_Idx);
        var marker_elem = create_params.template.append(elem, create_params.options, true);
        marker_elem.setTop(sm_HolderSize + 3);
        return marker_elem;
    }
    

}) }) ();



//////////////////////////////////////////////////////////////////////////
SeqView.PanoramaSelection = function(panoramaDivId, selectionDivId, range) {
    this.m_selectionDivId = selectionDivId;
    this.m_panoramaDivId = panoramaDivId;
    this.m_Resizing = false;
    this.range = range;
    this.element = Ext.get(this.m_selectionDivId);
};

SeqView.PanoramaSelection.prototype = {

    pageToViewX: function(x) {
        var div_xy = Ext.get(this.m_panoramaDivId).getXY();
        return x - div_xy[0];
    },

    resize: function(xSelection1, xSelection2) {
        var x1 = this.pageToViewX(xSelection1);
        var x2 = this.pageToViewX(xSelection2);
        var el = this.element;
        el.setLeft(x1 <= x2 ? x1 : x2);
        el.setWidth(Math.abs(x2 - x1));
    }
  
};
/*  $Id: textview.js 31224 2014-09-12 18:47:22Z joukovv $
 * ===========================================================================
 *
 *                            PUBLIC DOMAIN NOTICE
 *               National Center for Biotechnology Information
 *
 *  This software/database is a "United States Government Work" under the
 *  terms of the United States Copyright Act.  It was written as part of
 *  the author's official duties as a United States Government employee and
 *  thus cannot be copyrighted.  This software/database is freely available
 *  to the public for use. The National Library of Medicine and the U.S.
 *  Government have not placed any restriction on its use or reproduction.
 *
 *  Although all reasonable efforts have been taken to ensure the accuracy
 *  and reliability of the software and data, the NLM and the U.S.
 *  Government do not and cannot warrant the performance or results that
 *  may be obtained by using this software or data. The NLM and the U.S.
 *  Government disclaim all warranties, express or implied, including
 *  warranties of performance, merchantability or fitness for any particular
 *  purpose.
 *
 *  Please cite the author in any work or product based on this material.
 *
 * ===========================================================================
 *
 * Authors:  Vlad Lebedev, Maxim Didenko
 *
 * File Description: Sequence View Panel
 *
 */

 /********************************************************************/
//////////////////////////////////////////////////////////////////////
// SeqView.TextView
/********************************************************************/


SeqView.TextView = (function() {
    var sm_TextViewRows = 100; // Max of 100 rows in the sequence text panels
    var sm_ViewTmpl = new Ext.Template(
        '<table width="{width}" class="xsv-fasta-table sv-fasta-table" style="border-style:solid;border-width:{border}px;" >',
        '<tbody><tr bordercolor="#ffffff"><td id="left_sequence_{id}" width=50 valign="top" align="right"><br><NOBR><em>{left_nums}</em></NOBR></td>',
        '<td valign="top"><span id="top_sequence_{id}"><em>{top_nums}</em></span><br/><div id="text_sequence_{id}">{sequence}</div></td>',
        '</tr></tbody></table>'
    );

    function constructor(app) {
        var div_id = 'seq-dlg_' + app.m_Idx;
        if (Ext.get(div_id)) { return; }
        this.m_App = app;
        this.m_Idx = 'S' + this.m_App.m_Idx; // m_Idx is needed for Locator object;
        //this.m_View = view;
        this.m_DivId = div_id;
        this.m_Color = '000000';
        this.m_FromSeq = 0;
        this.m_LenSeq = 0;
        this.m_ShowTranslation = true;
        this.m_SequenceCols = Ext.isWindows ? 90 : 100; // 10 rows, 10 bases in each row. 100 bases per line (configurable)
        this.m_SeqStarts = [];
        this.m_Locator = null;
        this.m_PrevXY = [];
        this.m_Flip = false;
        this.m_TextViewSize = this.m_SequenceCols * sm_TextViewRows; // load sequence size (for text views)
        this.m_SelectedFeat = '';
        this.m_HideTrans = 1;

    };

    constructor.getViewTmpl = function() {
        return sm_ViewTmpl;
    };
    constructor.getTextViewRows = function() {
        return sm_TextViewRows;
    };

    return constructor;

})();

////////////////////////////////////////////////////////////////
/// Public methods

SeqView.TextView.prototype = {

    canFlip: function() {
        return this.m_App.m_ViewParams.acc_type == 'DNA';
    },

    getTitle: function() {
        var title = "Sequence View";
        if (this.canFlip())
            title += (this.m_Flip ? " (negative" : " (positive") + " strand)";
        return title;
    },

    openDlg: function(view) {
        if( this.m_SeqDlg ){
            this.m_SeqDlg.expand();
            return;
        }

        //console.log(view);

        var from_seq,len_seq;
        // check if pass a marker position
        if (typeof view == 'number') {
            from_seq = Math.max(0, view - 949);
        } else if (Ext.isArray(view)) {
            // range is passed from the URL
            from_seq = view[0];
            len_seq = view[1];
            this.m_Flip = view[2];
        } else {
            if (view.isPanorama()) { // no parent
                from_seq = Math.max(0, this.m_App.m_SeqLength / 2 - this.m_TextViewSize / 2);
            } else {
                this.m_Flip = view.getFlip();

                var vis_range = view.toSeq();
                from_seq = Math.max(0, vis_range[0] + vis_range[2] / 2 - this.m_TextViewSize / 2);
            }
            from_seq = Math.round(from_seq/10) * 10;
        }
        len_seq = Math.min(from_seq + this.m_TextViewSize, this.m_App.m_SeqLength) - from_seq;
        this.displaySequenceTextDlg(from_seq, len_seq);
    },


////////////////////////////////////////////////////////////////
/// displaySequenceTextDlg

    displaySequenceTextDlg: function(from_seq, len_seq) {
        this.m_App.resizeIFrame(500);
        this.startImageLoading(from_seq, len_seq);
        if( Ext.get('panorama_id') ){
            this.m_Locator = new SeqView.Locator(this, this.m_Color, false); // add locator
        }
        // Initial data loading
        this.m_SeqDlg = new Ext.Window({
            layout:'fit', title: this.getTitle(),
            width: 750, height: 450,
            minWidth: 480, minHeight: 200,
            constrain:false,collapsible:true, maximizable:true, hideAction:'close',
            monitorResize: true,
            cls: 'SeqViewerApp',
            onEsc: function() { this.close(); },
            listeners:{
                'resize': function(window, width, height) {
                    var top_id = 'top_sequence_' + this.m_App.m_Idx;
                    var left_id = 'left_sequence_' + this.m_App.m_Idx;
                    var cur_top = document.getElementById(top_id);
                    if (!cur_top) { return; }
                    var starts_width = Ext.get(left_id).getWidth() + 40;
                    var line_width = cur_top.offsetWidth;
                    var one_width = line_width / this.m_SequenceCols;
                    this.m_SequenceCols = Math.floor((width - starts_width) / one_width / 10) * 10;
                    this.m_TextViewSize = this.m_SequenceCols * SeqView.TextView.getTextViewRows();
                    this.startImageLoading(this.m_FromSeq, Math.min(this.m_TextViewSize, this.m_App.m_SeqLength));
                },
                'maximize': function( window ){
                    window.setWidth(
                        Ext.isIE ? document.documentElement.clientWidth
                        : !Ext.isOpera ? document.body.clientWidth : self.innerWidth
                    );
                },
                'move': function(win, x, y) {
                    var scrollY = Ext.getDoc().getScroll().top;
                    var p = this.m_SeqDlg.getPositionEl().translatePoints(x, scrollY);
                    if (y < p.top) {
                        this.m_SeqDlg.setPosition(x, p.top);
                    }
                },
                'beforeclose': function() { if (this.m_SeqDlg.maximized) this.m_SeqDlg.restore(); },
                'close': function() {
                    if (this.m_Locator) { this.m_Locator.remove(); }// remove locator form panoram
                    this.m_Locator = null;
                    this.m_App.un('origin_changed', this.onOriginChanged, this );
                    this.m_App.un('strand_changed', this.flipSeqPanelStrand, this );
                    this.m_App.m_TextView = null;
                    this.m_App.reCreateReflections();
                    delete this.m_SeqDlg;
                },
                scope: this
            },
            id: this.m_DivId,
            cls: 'SeqViewerApp',
            tbar:[
                {text:'Prev Page', scope: this, iconCls:'xsv-prev', handler:this.gotoSequencePrev},'-',
                {text:'Next Page', scope: this, iconCls:'xsv-next', handler:this.gotoSequenceNext},'->',

                //{text:'Show Gap', iconCls:'xsv-show_gap', handler:SeqApp.sequenceShowGap},'-',
                { xtype: 'combo',
                  id:'triplets_combo_' + this.m_App.m_Idx,
                  name: 'triplets',
                  fieldLabel: 'triplets',
                  mode: 'local',
                  forceSelection: 'true',
                  valueField: 'object_id',
                  hidden: true,
                  triggerAction: 'all',
                  store: new Ext.data.JsonStore({
                        fields: ['object_id', 'name'],
                        root: 'triplets',
                        data : {triplets: [] }
                  }),
                  displayField:'name',
                  width: 250,
                  listeners: {
                        select: function(c,r,i){
                            var store = c.getStore();
                            if (i != store.active) {
                                //console.log(r);
                                this.m_SelectedFeat = r.data.object_id;
                                this.startImageLoading(this.m_FromSeq, this.m_LenSeq);
                            }
                        },
                        scope:this
                    }
                },
                ' ',
                {tooltip:'Printer-Friendly Page', iconCls:'xsv-printer', scope:this, handler:function() { SeqView.PrinterFriendlyPage(this.m_App);/*SeqView.App.showPrintPageDlg(this.m_App.m_Idx);*/ }},
                '-',
                {text:'Flip Strands', id:'seq-flip-button', tooltip:'Flip Sequence Strands', iconCls:'xsv-flip-strands',
                    pressed:this.m_Flip, enableToggle:true, hidden: !this.canFlip(),
                    scope: this, handler:function() { this.m_App.setFlip(!this.m_Flip);/*this.flipSeqPanelStrand();*/} },
                this.m_App.m_ViewParams.acc_type != 'DNA' ? {hidden:true} : '-',
                {text: this.translationName(),
                   id: 'seq_trans_btn', //xtype: 'tbsplit',
                   tooltip:'Flip Translation', iconCls:'xsv-show_translation',
                   hidden: this.m_App.m_ViewParams.acc_type != 'DNA',
                   menuAlign:'tr-br?',
                   menu:new Ext.menu.Menu({items:[
                     {text:'Annotated', checked: this.m_HideTrans === 1, group:true, scope: this,
                            handler:function() { this.m_HideTrans = 1; this.flipSeqTranslation(); } },
                     {text:'Conceptual', checked: this.m_HideTrans === 2, group:true, scope: this,
                            handler:function() { this.m_HideTrans = 2; this.flipSeqTranslation(); } },
                     {text:'Both', checked: this.m_HideTrans === 0, group:true, scope: this,
                            handler:function() { this.m_HideTrans = 0; this.flipSeqTranslation(); } },
                     {text:'None', checked: this.m_HideTrans === 3, group:true, scope: this,
                            handler:function() { this.m_HideTrans = 3; this.flipSeqTranslation(); } }
                    ]})
                  },

                  this.m_App.m_ViewParams.acc_type != 'DNA'? {hidden:true} : '-',
                  {text:'Go To Position', iconCls:'xsv-goto_position', scope: this, handler:this.gotoSeqPositionDlg}

            ],
            modal: false,
            hidden: true,
            items:[{ xtype:'panel', autoScroll: true, id:'seq-panel_'+this.m_App.m_Idx, layout:'fit' }],
            buttons: [{text: 'Close', scope:this, handler: function() { this.m_SeqDlg.close(); }}]
        });
        var app = this.m_App;
        app.on('origin_changed', this.onOriginChanged, this );
        app.on('strand_changed', this.flipSeqPanelStrand, this );
        
        this.m_SeqDlg.on('close', function(){ app.resizeIFrame(); app.m_DialogShown = false; });

        app.m_DialogShown = true;
// This delay is not needed and in fact is buggy - when the callback for startImageLoading is called with the data
// the dialog can be not created yet.
//        if (app.m_iFrame) this.m_SeqDlg.show.defer(500, this.m_SeqDlg); else this.m_SeqDlg.show();
        this.m_SeqDlg.show();
    },

    onOriginChanged: function(app) {
        this.startImageLoading(this.m_FromSeq, this.m_LenSeq);
    },

////////////////////////////////////////////////////////////////
/// startImageLoading:

    startImageLoading: function(from, len) {
        this.m_FromSeq = from;
        this.m_LenSeq = len;
        SeqView.App.simpleAjaxRequest({url: this.getSeqTextURL(), context:this, success: this.seqLoadCallback/*, error: this.seqLoadCallback*/});
    },

////////////////////////////////////////////////////////////////
/// getSeqTextURL
    getSeqTextURL: function() {
        var to_seq = this.m_FromSeq + this.m_LenSeq;
        var user_data_key = "";
        if (this.m_App.m_Key) {
            user_data_key = "&key=" + this.m_App.m_Key;
        }
        return this.m_App.m_CGIs.Sequence + '?opts=seq&id=' + this.m_App.GI + '&from=' + this.m_FromSeq + '&to=' + to_seq + '&col=' +
            this.m_SequenceCols + '&translation=' + (this.m_ShowTranslation ? 'true' : 'false') +
            '&reverse=' + (this.m_Flip ? 'true' : 'false') + '&selected=' + this.m_SelectedFeat + user_data_key;
    },

////////////////////////////////////////////////////////////////
/// genTopNumbers
    genTopNumbers: function() {
        var top_nums = "";
        for (var i = 0; i != this.m_SequenceCols / 10; i++) {
            if (this.m_Flip) { top_nums += '<span>0</span>987654321'; }
            else { top_nums += '123456789<span>0</span>'; }
        }
        return top_nums;
    },

////////////////////////////////////////////////////////////////
/// seqLoadCallback

    seqLoadCallback: function(data, text) {
        var trip_cb_comp = Ext.getCmp('triplets_combo_' + this.m_App.m_Idx);
        if (!trip_cb_comp) return;
        var from_cgi = data;

        var starts = from_cgi.starts
        var fromindex = 0;
        this.m_SeqStarts = [];
        while (true) { // build vertical positions array
            var newindex = starts.indexOf("<", fromindex);
            if (newindex == -1) { break; }
            var a_char = starts.substr(newindex + 1, 1);
            if (a_char=="d") {
                var tr_type = starts.substr(newindex+16,13);
                //! HACK
                if( this.m_SeqStarts.length > 0 ){
                    if (tr_type == 'seqtrans_prot') {
                        this.m_SeqStarts.push(-2);
                    } else {
                        this.m_SeqStarts.push(-1);
                    }
                }
                fromindex = newindex + 6;
            } else if (a_char=="b") {
                var num = parseInt( starts.substr(fromindex, newindex - fromindex) );
                this.m_SeqStarts.push(num);
                fromindex = newindex + 4;
            } else if (a_char=="/") {
                fromindex = newindex + 6;
            } else {
                break;
            }
        }

        if (this.m_App.getOrigin() != 0  ||  this.m_App.getFlip()) {
            var new_starts = '';
            re = /([^0-9]*)([0-9]+)(<br>)/ig;
            var arr;
            while ((arr = re.exec(starts)) != null) {
                new_starts += (arr[1] + this.m_App.posToLocal(arr[2]) + arr[3]);
            }

            starts = new_starts;
        }
        var top_nums = this.genTopNumbers();

        var html = SeqView.TextView.getViewTmpl().apply({border:0, width:'95%', left_nums:starts, top_nums:top_nums, id: this.m_App.m_Idx, sequence:from_cgi.sequence});
        Ext.getCmp('seq-panel_'+this.m_App.m_Idx).update(html);
        // Add tooltips
        var idx = 1;
        var ttl_search = from_cgi.app_id? 'ttl-'+from_cgi.app_id+'-' : 'ttl-id';
        while (true) {
            var tip_elem = Ext.get(ttl_search + idx);
            if (!tip_elem) { break; }
            var idx_array = tip_elem.dom.getAttribute('rel').split(',');
            var feat_idx = idx_array[idx_array.length-1];
            var sig = "";
            for (j=0; j!=from_cgi.features.length; j++) {
                var feat = from_cgi.features[j];
                if (feat.id == feat_idx) { sig = feat.object_id; break; }
            }
            if (sig.length > 0) {
                var app = this.m_App;
                var qtip = new Ext.ToolTip({
                    target:tip_elem, trackMouse:false,
                    autoWidth:true, autoHide:true,
                    dismissDelay:5000, cls: 'SeqViewerApp',
                    cfg: { url: app.m_CGIs.ObjInfo+'?objinfo=1&signatures='+sig+'&id='+app.GI,
                        success: function(data) {
                            var objs = SeqView.decode(data);
                            this.body.update(objs[0].text);
                        }
                    }
                });
                qtip.cfg.context = qtip;
                qtip.on('render', function(){ app.AjaxRequest(this.cfg); }, qtip);
            }
            idx++;
        } // while

        this.m_App.reCreateReflections(); // show reflections

        // add markers
        this.m_App.forEachMarker( function(m) { this.AddOrUpdateMarker(m); }, this);

        this.flipSeqTranslation();

        if (from_cgi.triplets) {
            var store = trip_cb_comp.getStore();
            store.loadData(from_cgi.triplets);
            store.active = from_cgi.triplets.selected || 0;
            this.m_SelectedFeat = store.getAt(store.active).data.object_id;
            trip_cb_comp.setValue(this.m_SelectedFeat);
            trip_cb_comp.show();
            trip_cb_comp.collapse();
        } else {
            trip_cb_comp.hide();
            this.m_SelectedFeat = '';
        }

        // add events
        Ext.get(this.m_DivId).on({
            'mousedown':    this.onMouseDown,
            'mouseup':      this.onMouseUp,
            'mousemove':    this.onMouseMove,
            'contextmenu':  this.onContextMenu,
            scope: this
        });

        // adjust locator
        this.m_App.updateLocator(this);
    },

////////////////////////////////////////////////////////////////
/// AddOrUpdateMarker

    AddOrUpdateMarker: function(the_marker) {//num, color, seq_pos, name) {
        var seq_elem = Ext.get('text_sequence_' + this.m_App.m_Idx);
        if (seq_elem) {
            var char_height = this.getLineHeight();
            var char_width = this.getCharWidth();
            if (the_marker.span) {
                var marker = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+the_marker.marker_num+'_b');
                if (!marker) {
                    var tmpl = new Ext.Template('<div orig_id="marker_0_{num}" id="seqtext-marker_{aidx}_{num}_b" ext:qtip="start of {name}" class="xsv-text_marker" style="border-color:{color};border-{side}: none; height:{height}; width:{width};"><div ext:qtip="Locked" id="seqtext-marker_{aidx}_{num}_lock_b" style="display:{lock};" class="marker_locked_ov"></div> </div>');
                    marker = tmpl.append(seq_elem,
                                    {num:the_marker.marker_num, aidx:this.m_App.m_Idx,
                                     color:the_marker.color, name:the_marker.marker_name,
                                     lock:the_marker.lock?'inline':'none', side:this.m_App.getFlip()?'left':'right',
                                     height:char_height-2,width:char_width-2
                                    }, true);
                }
                this.setTextMarker(marker, the_marker.seq_pos);
                marker = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+the_marker.marker_num+'_e');
                if (!marker) {
                    var tmpl = new Ext.Template('<div orig_id="marker_0_{num}" id="seqtext-marker_{aidx}_{num}_e" ext:qtip="end of {name}" class="xsv-text_marker" style="border-color:{color};border-{side}: none;height:{height}; width:{width};"><div ext:qtip="Locked" id="seqtext-marker_{aidx}_{num}_lock_e" style="display:{lock};" class="marker_locked_ov"></div> </div>');
                    marker = tmpl.append(seq_elem,
                                    {num:the_marker.marker_num, aidx:this.m_App.m_Idx,
                                     color:the_marker.color, name:the_marker.marker_name,
                                     lock:the_marker.lock?'inline':'none', side:this.m_App.getFlip()?'right':'left',
                                     height:char_height-2,width:char_width
                                    }, true);
                }
                this.setTextMarker(marker, the_marker.seq_pos + the_marker.span - 1);
            } else {
                var marker = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+the_marker.marker_num);
                if (!marker) {
                    var tmpl = new Ext.Template('<div orig_id="marker_0_{num}" id="seqtext-marker_{aidx}_{num}" ext:qtip="{name}" class="xsv-text_marker" style="border-color:{color};height:{height}; width:{width};"><div ext:qtip="Locked" id="seqtext-marker_{aidx}_{num}_lock" style="display:{lock};" class="marker_locked_ov"></div> </div>');
                    marker = tmpl.append(seq_elem,
                                    {num:the_marker.marker_num, aidx:this.m_App.m_Idx,
                                     color:the_marker.color, name:the_marker.marker_name,
                                     lock:the_marker.lock?'inline':'none',
                                     height:char_height-2,width:char_width-2
                                    }, true);
                }
                this.setTextMarker(marker, the_marker.seq_pos);
            }
        }
    },

////////////////////////////////////////////////////////////////
/// UpdateLockMarker

    UpdateLockMarker: function(marker) {
        if (marker.span) {
            var seq_marker = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+marker.marker_num+'_lock_b');
            if (seq_marker) {
                seq_marker.setStyle('display', marker.lock ? 'inline' : 'none');
            }
            seq_marker = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+marker.marker_num+'_lock_e');
            if (seq_marker) {
                seq_marker.setStyle('display', marker.lock ? 'inline' : 'none');
            }
        } else {
            var seq_marker = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+marker.marker_num+'_lock');
            if (seq_marker) {
                seq_marker.setStyle('display', marker.lock ? 'inline' : 'none');
            }
        }
    },

////////////////////////////////////////////////////////////////
/// RemoveMarker

    RemoveMarker: function(marker) {
        if (marker.span) {
            var seq_marker = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+marker.marker_num+'_b');
            if (seq_marker)
                seq_marker.remove();
            seq_marker = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+marker.marker_num+'_e');
            if (seq_marker)
                seq_marker.remove();
        } else {
            var seq_marker = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+marker.marker_num);
            if (seq_marker)
                seq_marker.remove();
        }
    },

////////////////////////////////////////////////////////////////
/// SetSeqPos

    SetSeqPos: function(marker) {
        /* Marker type can change from point to span, redirect this to more
           general AddOrUpdateMarker which handles this
        if (marker.span) {
            var text_marker = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+marker.marker_num+'_b');
            this.setTextMarker(text_marker, marker.seq_pos);
            text_marker = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+marker.marker_num+'_e');
            this.setTextMarker(text_marker, marker.seq_pos + marker.span - 1);
        } else {
            var text_marker = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+marker.marker_num);
            this.setTextMarker(text_marker, marker.seq_pos);
        }
        */
        // If marker type changed, clean up old marker
        if (marker.span) {
            var seq_marker = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+marker.marker_num);
            if (seq_marker)
                seq_marker.remove();
        } else {
            var seq_marker = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+marker.marker_num+'_b');
            if (seq_marker)
                seq_marker.remove();
            seq_marker = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+marker.marker_num+'_e');
            if (seq_marker)
                seq_marker.remove();
        }
        this.AddOrUpdateMarker(marker);
    },

////////////////////////////////////////////////////////////////
/// getLineHeight

    getLineHeight: function() {
        var tm = Ext.util.TextMetrics.createInstance( Ext.get('top_sequence_' + this.m_App.m_Idx) );
        return tm.getHeight("A");
    },
    getCharWidth: function() {
        var tm = Ext.util.TextMetrics.createInstance( Ext.get('top_sequence_' + this.m_App.m_Idx) );
        return tm.getWidth("A");
    },

////////////////////////////////////////////////////////////////
/// setTextMarker

    setTextMarker: function(marker_elem, seq_pos) {
    
        if (seq_pos < this.m_FromSeq  ||  seq_pos >= this.m_FromSeq + this.m_LenSeq - 1) {
            marker_elem.setVisible(false);
            return;
        } else marker_elem.setVisible(true);

        var starts_width = Ext.get('left_sequence_' + this.m_App.m_Idx).getWidth() + 2;
        var line_width = document.getElementById('top_sequence_' + this.m_App.m_Idx).offsetWidth;
        var one_width = line_width / this.m_SequenceCols;

        var one_height_seq = this.getLineHeight();
        var one_height_trans = one_height_seq + 2;

        // 0-based to 1-based position shift
        seq_pos += 1;
        
        var marker_y = 2;
        var row_start = 0;
        var i;
        if (this.m_Flip) {
            for (i = 0; i != this.m_SeqStarts.length; i++) {
                row_start = this.m_SeqStarts[i];
                if( row_start < 0 ){
                    if( (row_start != -this.m_HideTrans || this.m_HideTrans == 0) && this.m_HideTrans != 3 ){
                        marker_y += one_height_trans;
                    }
                } else {
                    marker_y += one_height_seq;
                }

                if( row_start < 0 ) continue;
                if( seq_pos >= row_start - this.m_SequenceCols  &&  seq_pos < row_start ) break;
            }
            pos_h = row_start - seq_pos - 1;
            var left_pos = starts_width + one_width * pos_h  - 1;
            if( Ext.isIE7 ) left_pos += 2;
            marker_elem.setLeft( left_pos );
        } else {
            for (i = 0; i != this.m_SeqStarts.length; i++) {
                row_start = this.m_SeqStarts[i];
                if (row_start < 0) {
                    if ((row_start != -this.m_HideTrans || this.m_HideTrans === 0) && this.m_HideTrans !== 3) {
                        marker_y += one_height_trans;
                    }
                } else {
                    marker_y += one_height_seq;
                }

                if (row_start < 0) { continue; }
                if (seq_pos >= row_start  &&  seq_pos < row_start + this.m_SequenceCols) { break; }
            }
            var left_pos = starts_width + one_width * (seq_pos - row_start)  - 1;
            if (Ext.isIE) left_pos += 2;
            marker_elem.setLeft(left_pos);
        }
        marker_elem.setTop(marker_y - 2);
    },

////////////////////////////////////////////////////////////////
/// SeqText2SeqPos

    SeqText2SeqPos: function(new_top, new_left) { // sequence 2 screen (text view)
        var starts_width = Ext.get('left_sequence_' + this.m_App.m_Idx).getWidth() + 2;
        var line_width = document.getElementById('top_sequence_' + this.m_App.m_Idx).offsetWidth;
        var one_width = line_width / this.m_SequenceCols;

        var one_height_seq = this.getLineHeight();
        var one_height_trans = one_height_seq + 1;

        var seq_pos = 0;
        var x = 0;
        var y = 0;
        var row_start = 0;
        new_top = new_top - (one_height_seq + 2);
        var prev_row_start = -1;

        var half = one_height_seq / 2;

        for (var i = 0; i != this.m_SeqStarts.length; i++) {
            row_start = this.m_SeqStarts[i];
            if (row_start < 0) {
                if ((row_start != -this.m_HideTrans || this.m_HideTrans == 0) && this.m_HideTrans != 3) {
                    y += one_height_trans;
                }
                if (new_top <= y-half) { break; }
                else { continue; }
            }
            prev_row_start = row_start;
            if (new_top >= y-half  &&  new_top < y + one_height_seq-half) { break; }
            y += one_height_seq;
        }
        x = Math.ceil((new_left - starts_width) / one_width);

        if (this.m_Flip) { return prev_row_start - x - 1; }
        else { return prev_row_start + x; }
    },

////////////////////////////////////////////////////////////////
/// onMouseDown

    onMouseDown: function(e) {
        if (e.button === 0) {
            var elem = e.getTarget().id;
            if (elem.indexOf('seqtext-marker_') != 0) { return; }

            // check for lock
            var idx = elem.split('_')[2];
            var the_marker = this.m_App.findMarker('marker_0_' + idx);
            if (!the_marker || the_marker.lock) { return; }

            // ok, ready to drag
            this.m_PrevXY = e.getXY();
            this.m_CurMarker = Ext.get(elem);
            this.m_CurMarker.setStyle('cursor', 'move');
        }
    },

////////////////////////////////////////////////////////////////
/// onMouseUp

    onMouseUp: function(e) {
        if (!this.m_PrevXY || !this.m_CurMarker) { return; }

        var orig = this.m_CurMarker.dom.getAttribute('orig_id');
        var marker = this.m_App.findMarker(orig);

        var seq_pos = this.SeqText2SeqPos(this.m_CurMarker.getTop(true), this.m_CurMarker.getLeft(true));

        if (marker) {
            if (marker.span) {
                var eid = this.m_CurMarker.id;
                if (eid.indexOf('_b') != -1) {
                    var oelem = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+marker.marker_num+'_e');
                    if (oelem) {
                        this.setTextMarker(oelem, seq_pos + marker.span -1);
                    }
                    marker.setSeqPos( seq_pos/*-1*/, false );
                } else {
                    var oelem = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+marker.marker_num+'_b');
                    var pos = seq_pos - marker.span +1;
                    if (oelem) {
                        this.setTextMarker(oelem, pos);
                    }
                    marker.setSeqPos( pos, false );
                }
            } else {
                marker.setSeqPos( seq_pos/*-1*/, false );
            }
            this.setTextMarker(this.m_CurMarker, seq_pos);
        }

        this.m_PrevXY = null;
        this.m_CurMarker = null;
    },

////////////////////////////////////////////////////////////////
/// onContextMenu

    onContextMenu: function(e) {
        e.preventDefault();
        e.stopPropagation();

        var elem = e.getTarget().id;
        //console.log(elem);
        if (elem.indexOf('seqtext-marker') == 0) {
            var menu = new Ext.menu.Menu();
            var idx = elem.split('_')[2];
            var marker = this.m_App.findMarker('marker_0_' + idx);
            if (marker) {
                menu.add(marker.marker_name);
                menu.add('-');
                menu.add({text:'Set To Position...', scope:this, handler:function() {
                    var cur_pos = marker.seq_pos-this.m_App.getOrigin();
                    if (cur_pos >= 0) { cur_pos++; }
                    Ext.MessageBox.prompt('Marker', 'Please enter new sequence position:', function(btn, text) {
                        if (btn!='ok' || text.length == 0) { return; }
                        var seq_pos = this.m_App.convertRelativePosition(text);
                        if (isNaN(seq_pos) || seq_pos < 0 || seq_pos >= this.m_App.m_SeqLength) {
                            Ext.MessageBox.show({title:m.marker_name, msg:'Invalid sequence position.', buttons:Ext.MessageBox.OK, icon:Ext.MessageBox.ERROR});
                            return;
                        }
                        marker.setSeqPos(seq_pos,true);
                    }, this, false, cur_pos ); }
                });
                menu.add('-');
                menu.add({iconCls:'xsv-marker-remove', scope:this, text:'Remove Marker', handler:function() { marker.deleteMarker(); } });
                menu.add({iconCls:'xsv-markers', text:'Marker Details', scope:this, handler:function() { this.m_App.showMarkersDlg( this ); } });

                menu.showAt(e.getXY());
            }
        }
    },

////////////////////////////////////////////////////////////////
/// onMouseMove

    onMouseMove: function(e) {
        if (!this.m_PrevXY || !this.m_CurMarker) {
            return;
        }

        var delta_x = this.m_PrevXY[0] - e.getXY()[0];
        var delta_y = this.m_PrevXY[1] - e.getXY()[1];
        this.m_PrevXY = e.getXY(); // save new values

        SeqView.ClearBrowserSelection();

        var starts_width = Ext.get('left_sequence_' + this.m_App.m_Idx).getWidth() + 2;
        var line_width = document.getElementById('top_sequence_' + this.m_App.m_Idx).offsetWidth;

        var new_left = this.m_CurMarker.getLeft(true) - delta_x;
        var new_top = this.m_CurMarker.getTop(true) - delta_y;

        new_left = Math.min(new_left, starts_width + line_width-7);
        new_left = Math.max(new_left, starts_width);

        new_top = Math.min(new_top, Ext.get('text_sequence_' + this.m_App.m_Idx).getHeight());
        new_top = Math.max(new_top, Ext.get('top_sequence_' + this.m_App.m_Idx).getHeight()+1);

        var seq_pos = this.SeqText2SeqPos(new_top, new_left);

        this.m_CurMarker.setLeft(new_left);
        this.m_CurMarker.setTop(new_top);

        var orig = this.m_CurMarker.dom.getAttribute('orig_id');
        var marker = this.m_App.findMarker(orig);

        if (marker) {
            if (marker.span) {
                var eid = this.m_CurMarker.id;
                if (eid.indexOf('_b') != -1 ) {
                    var oelem = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+marker.marker_num+'_e');
                    if (oelem) {
                        this.setTextMarker(oelem, seq_pos + marker.span -1);
                    }
                    marker.setSeqPos( seq_pos/*-1*/, false );
                } else {
                    var oelem = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+marker.marker_num+'_b');
                    var pos = seq_pos - marker.span +1;
                    if (oelem) {
                        this.setTextMarker(oelem, pos);
                    }
                    marker.setSeqPos( pos, false );
                }
            } else {
                marker.setSeqPos( seq_pos/*-1*/, false );
            }
        }
    },

////////////////////////////////////////////////////////////////
/// gotoSequenceNext

    gotoSequenceNext: function() {
        var from_seq = Math.min(this.m_FromSeq + this.m_TextViewSize, this.m_App.m_SeqLength - this.m_TextViewSize);
        //m_FromSequence = Math.round(m_FromSequence / 10) * 10 + 1;
        from_seq = Math.max(0, from_seq);
        //this.m_LenSeq   = Math.min(this.m_LenSeq + this.m_TextViewSize, this.m_App.m_SeqLength);
        this.startImageLoading(from_seq, this.m_LenSeq);
    },

////////////////////////////////////////////////////////////////
/// gotoSequencePrev

    gotoSequencePrev: function() {
        var from_seq = Math.max(0, this.m_FromSeq - this.m_TextViewSize);
        //m_FromSequence = Math.round(m_FromSequence / 10) * 10 + 1;
        //this.m_LenSeq   = Math.min(m_FromSequence+m_TextViewSize-1, m_SeqLength-1);
        this.startImageLoading(from_seq, this.m_LenSeq);
    },

////////////////////////////////////////////////////////////////
/// translationName

    translationName: function() {
        if (this.m_HideTrans == 1)
            return "Annotated";
        else if (this.m_HideTrans == 2)
            return "Conceptual";
        else if (this.m_HideTrans == 3)
            return "None";
        else
            return "Both";
    },

////////////////////////////////////////////////////////////////
/// flipSeqPanelStrand

    flipSeqPanelStrand: function() {
        this.m_Flip = !this.m_Flip;
        this.startImageLoading(this.m_FromSeq, this.m_LenSeq);
        Ext.getCmp('seq-flip-button').toggle(this.m_Flip);
        if (this.m_SeqDlg)
            this.m_SeqDlg.setTitle(this.getTitle());
    },

////////////////////////////////////////////////////////////////
/// flipSeqTranslation

    flipSeqTranslation: function() {
        var items, i, el;
        if (this.m_HideTrans == 0 || this.m_HideTrans == 3) {
            items = Ext.query('div[class^=xsv-seqtrans_]');
            for(i = 0; i < items.length; i++) {
                el = Ext.get(items[i]);
                el.setStyle('display',(this.m_HideTrans == 0 ? 'block' : 'none'));
                if (this.m_HideTrans == 0) {
                    Ext.util.CSS.updateRule('.xsv-ttu3','border-top-width', '0px');
                    Ext.util.CSS.updateRule('.xsv-ttu7', 'border-top-width', '0px');
                }
            }
        } else {
            Ext.util.CSS.updateRule('.xsv-ttu3', 'border-top-width', '2px');
            Ext.util.CSS.updateRule('.xsv-ttu7', 'border-top-width', '2px');
            items = Ext.query('div[class^=xsv-seqtrans_prot]');
            for(i = 0; i < items.length; i++) {
                el = Ext.get(items[i]);
                el.setStyle('display',(this.m_HideTrans == 1 ? 'block' : 'none'));
            }
            items = Ext.query('div[class^=xsv-seqtrans_trans]');
            for(i = 0; i < items.length; i++) {
                el = Ext.get(items[i]);
                el.setStyle('display',(this.m_HideTrans == 2 ? 'block' : 'none'));
            }
        }
        this.m_App.forEachMarker(function(m) {
            if (m.span) {
                var text_marker = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+m.marker_num+'_b');
                this.setTextMarker(text_marker, m.seq_pos);
                text_marker = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+m.marker_num+'_e');
                this.setTextMarker(text_marker, m.seq_pos + m.span - 1);
            } else {
                var text_marker = Ext.get('seqtext-marker_'+this.m_App.m_Idx+'_'+m.marker_num);
                this.setTextMarker(text_marker, m.seq_pos);
            }
        },this);
        el = Ext.getCmp('seq_trans_btn');
        el.setText(this.translationName());
    },

////////////////////////////////////////////////////////////////
/// gotoSeqPositionDlg

    gotoSeqPositionDlg: function() {
        Ext.MessageBox.prompt('Go to position',
        'Please enter sequence position<br />(possible&nbsp;value&nbsp;formats&nbsp;are&nbsp;10k,&nbsp;-20,&nbsp;1m):',
            function(btn, text) {
            if (btn!='ok'  || text.length === 0) { return; }
            var position = 0;
            var bad_pos = !SeqView.IsNumeric(text);
            if (!bad_pos) {
                position = SeqView.stringToNum(text);
                position = this.m_App.posToGlobal(position)
                if (position >= this.m_App.m_SeqLength) {
                    bad_pos = true;
                }
            }
            if (bad_pos) {
                Ext.MessageBox.alert('Go to position', 'Invalid position.');
            } else {
                var from_seq = Math.min(position, this.m_App.m_SeqLength - this.m_TextViewSize);
                from_seq = Math.max(0, from_seq);
                //m_ToSequence   = Math.min(m_FromSequence+m_TextViewSize-1, m_SeqLength-1);
                this.startImageLoading(from_seq, this.m_LenSeq);
            }
        }, this, false);
    },

//////////////////////////////////////////////////////////////////////////
// syncToLocator:

    syncToLocator: function() {
        if (!this.m_Locator) {
            return;
        }
        var from_seq = this.m_App.m_Panorama.toSeq( this.m_Locator.getLeft(true) );
        //m_ToSequence   = Math.min(m_FromSequence+m_TextViewSize-1, m_SeqLength-1);
        this.startImageLoading(from_seq, this.m_LenSeq);
    },

//////////////////////////////////////////////////////////////////////////
// toSeq:

    toSeq: function() {
        return [this.m_FromSeq, this.m_FromSeq + this.m_LenSeq - 1, this.m_LenSeq];
    },

    isPanorama: function() {
        return false;
    },

    getURL: function() {
        return "&seq=" + (this.m_FromSeq+1) + ':' + (this.m_FromSeq+this.m_LenSeq)
    },

    isPanorama: function() {
        return false;
    },

    isLoading: function() {
        return this.m_Loading;
    }

};

/*  $Id: alignview.js 34117 2015-11-05 18:20:29Z borodine $
 * ===========================================================================
 *
 *                            PUBLIC DOMAIN NOTICE
 *               National Center for Biotechnology Information
 *
 *  This software/database is a "United States Government Work" under the
 *  terms of the United States Copyright Act.  It was written as part of
 *  the author's official duties as a United States Government employee and
 *  thus cannot be copyrighted.  This software/database is freely available
 *  to the public for use. The National Library of Medicine and the U.S.
 *  Government have not placed any restriction on its use or reproduction.
 *
 *  Although all reasonable efforts have been taken to ensure the accuracy
 *  and reliability of the software and data, the NLM and the U.S.
 *  Government do not and cannot warrant the performance or results that
 *  may be obtained by using this software or data. The NLM and the U.S.
 *  Government disclaim all warranties, express or implied, including
 *  warranties of performance, merchantability or fitness for any particular
 *  purpose.
 *
 *  Please cite the author in any work or product based on this material.
 *
 * ===========================================================================
 *
 * Authors:  Vlad Lebedev, Maxim Didenko
 *
 * File Description:
 *
 */
 
 
/********************************************************************/
//////////////////////////////////////////////////////////////////////
// SeqView.AlignSelection 
/********************************************************************/

SeqView.AlignSelection = function(view, area) {
   this.area = area;
   this.m_View = view; // view index
   //this.signature = area['signature'];
   this.parent_elem = Ext.get(this.m_View.m_DivId);
   
   var tpl = new Ext.Template('<div id="align_selection_id_{idx}" class="over_selection"/>');
   
   this.element = tpl.append(this.parent_elem, {idx:this.m_View.m_Idx}, true);
   this.element.setLeft(area.x); // the output from cgi seems a bit off. That's why this offsets. Or is it browser-specific? :)
   this.element.setTop(area.y); 
   this.element.setHeight(area.h);
   this.element.setWidth(area.w);
   
   this.element.on({
        //'dblclick' : SeqApp.onGViewDblClick,
        'click' :   this.m_View.onClick,
        //'mousedown' : SeqApp.onGViewMouseDown,
        //'mouseup' : SeqApp.onGViewMouseUp,
        'mousemove' : function(e) {e.stopPropagation();} ,
        //'contextmenu' : SeqApp.onGViewContextMenu
        scope: this.m_View
   });
   
    this.qtip = new Ext.ToolTip({
        target: this.element, 
        trackMouse:false, 
        autoWidth:true, 
        autoHide:true, 
        html:area.descr, 
        dismissDelay:5000,
        cls: 'SeqViewerApp'
    });
};


SeqView.AlignSelection.prototype = {
    movePix: function(delta) {
        new_left = this.element.getLeft(true) - delta;
        this.element.setLeft(new_left);
    },
    remove: function() { 
        if (this.qtip) {
            this.qtip.destroy();
        }
        this.element.remove(); 
    }
};


/********************************************************************/
//////////////////////////////////////////////////////////////////////
// SeqView.Alignment 
/********************************************************************/

SeqView.Alignment = (function() { 

    return Ext.extend(SeqView.View, {
    m_PrevXY: null,
    m_FromSeq: 0,
    m_LenSeq:  0,
    m_ViewPageSize: 500,
    m_Expand: '',
    m_History: [],

//////////////////////////////////////////////////////////////////////////
// constructor:
    
    constructor: function(app) {
        SeqView.Alignment.superclass.constructor.apply(this, ['alignment', app]);
    },

    isAlignment: function() {
        return true;
    },

//////////////////////////////////////////////////////////////////////////
// createPanel:

    createPanel: function() {
        this.m_DivId = 'alignment_id' + this.m_Idx;
        
        var tbar = [];
        
        if (this.m_App.m_Embedded === false) {
            this.m_Spacer = this.m_App.addView({
				border:false, 
				height:SeqView.View.getSpacerHeight()
				/*
				,
				style: { clear: 'both' }
				*/
			}); // spacer
            tbar.push(this.createChooseColorBtn(), '-');
        }
        /*
        tbar.push(
            {iconCls:'xsv-zoom_plus', tooltip:'Zoom In', scope:this, handler:function() { this.zoomIn(); } }, 
            {iconCls:'xsv-zoom_minus', tooltip:'Zoom Out', scope:this, handler:function() { this.zoomOut(); } }, 
            {iconCls:'xsv-zoom_seq', tooltip:'Zoom To Sequence', scope:this, handler:function() { this.zoomSeq(); } },
            '-',
            {iconCls:'xsv-prev', tooltip:'Prev Page', scope:this, handler:function() { this.gotoPrev(); }},'-',
            {iconCls:'xsv-next', tooltip:'Next Page', scope:this, handler:function() { this.gotoNext(); }},'->',
            {iconCls:'x-tbar-loading', id:'seq-view-loading-'+this.m_Idx, tooltip:'Reload View', scope:this, handler: function() { this.refresh(); } }
        );
        */
        
        var range = this.toSeq();
        var r_range_from = this.m_App.posToLocal(range[0]);
        var r_range_to   = this.m_App.posToLocal(range[1]);
        if( this.m_App.m_Flip ){
            var t = r_range_from;
            r_range_from = r_range_to;
            r_range_to = t;
        }
        
        if( this.m_App.m_Toolbar["history"] == true ){
            tbar.push(
                { iconCls:'back', tooltip: 'Go back', itemId: 'histPrev'+this.m_Idx, scope:this, 
                    handler:function() { 
                        this.stepHistory(); 
                    }
                }
                //{ iconCls:'next', tooltip: 'Forward', itemId: 'histNext', scope:this, handler:function() { this.stepHistory( true ) } }
            );          
        }
        
        if( this.m_App.m_Toolbar["name"] == true ){
            var tiptitle = '<b>'
            tiptitle += this.m_App.m_ViewParams['id'];
            tiptitle += ': ' + this.m_App.m_Config.SeqInfo.title;
            tiptitle += '</b><br/><br/>';
            
            tiptitle += r_range_from.commify() + '&nbsp;-&nbsp;' + r_range_to.commify();
             
            tiptitle += '&nbsp;('+ (range[1] - range[0] + 1).commify() + '&nbsp;';
            tiptitle += (this.m_App.m_ViewParams['acc_type']=='protein' ? 'residues' : 'bases');
            tiptitle += '&nbsp;shown';
            
            if( this.m_App.m_ViewParams.acc_type == 'DNA' ){ 
                if( this.m_App.m_Flip ){
                    tiptitle += ',&nbsp;negative strand'; 
                } else { 
                    tiptitle += ',&nbsp;positive strand'; 
                }
            }
            tiptitle += ")";
            
            var title = '<b>' + r_range_from.commify() + ' - ' + r_range_to.commify() + ' (' + range[2].commify() + ' bases shown)</b>';
            
            
            tbar.push({ text: title, itemId: 'tbtitle'+this.m_Idx, tooltip: tiptitle, width: 200, handler: this.openFullView,  scope:this });
        }
        if( this.m_App.m_Toolbar["panning"] == true ){
                tbar.push(
                '-',
                    {iconCls:'pan-left', tooltip: 'Pan left', scope:this, handler:function() { this.gotoPrev(); }},
                    {iconCls:'pan-right', tooltip: 'Pan right', scope:this, handler:function() { this.gotoNext(); }},
                    '-'
                );
            }                       
                            
        if( this.m_App.m_Toolbar["zoom"] == true ){
            tbar.push(
                //{iconCls:'xsv-zoom_minus', tooltip:'Zoom Out', scope:this, handler:function() { this.m_ZoomOP = 'button'; this.zoomOut();}}
            {text: '&nbsp;&nbsp;-&nbsp;&nbsp;', scale: 'small',tooltip:'Zoom Out', scope:this, handler:function() { this.zoomOut();}}
            );
        
            this.m_TbSlider = new Ext.Slider({
                name: 'zoom', width: 100,  
                minValue: 0, maxValue: 100, value: 0, increment: 5,
                topThumbZIndex: 100,
                tipText: function(thumb){ return String(thumb.value) + '%'; },
                listeners: { 
                    changecomplete: function(el,val) { 
                      var slider_range = 100;
                            var slider_val = 100 - val;
                                      
                            var vis_range = this.toSeq();
                            var zoom_point = vis_range[0] + vis_range[2] / 2;
                                      
                            var max_bases_to_show = this.m_App.m_SeqLength;
                            var rightPix = this.m_View.getInnerWidth()-2;
                            var min_bases_to_show = rightPix * SeqView.MinBpp;
                            //var min_bases_to_show1 = this.m_App.getPanoramaWidth() / 10;
                       
                            var ee = Math.log(max_bases_to_show / min_bases_to_show);
                             
                            var slider_val = Math.min(slider_range, Math.max(0, slider_val));
                             
                            var len = min_bases_to_show * Math.exp(ee * slider_val / slider_range);
                            var from = zoom_point - len / 2;

                            len = Math.min(this.m_App.m_SeqLength, Math.round(len));
                            from = Math.round( Math.max(0, from) );
                            if (from + len > this.m_App.m_SeqLength) {
                                var extra = from + len - this.m_App.m_SeqLength;
                                from -= extra;
                            }
                            //this.m_ZoomOP = 'slider';
                            this.pushToHistory(range[0], range[1]-range[0],"");
                            this.loadImage(from, len);

                    }.createDelegate(this)
                }
            });
            tbar.push( this.m_TbSlider );   

            tbar.push(
                //{iconCls:'xsv-zoom_plus', tooltip:'Zoom In', scope:this, handler:function() { this.m_ZoomOP = 'button'; this.zoomIn();} },
            {text: '&nbsp;&nbsp;+&nbsp;&nbsp;', scale: 'small',tooltip:'Zoom In', scope:this, handler:function() { this.zoomIn();} },
            {iconCls:'xsv-zoom_seq', tooltip:'Zoom To Sequence', scope:this, handler:function() { this.zoomSeq();} }
            
            );
        }
        tbar.push('->');
        
    
        if( this.m_App.m_Toolbar["reload"] == true ){
            tbar.push(
                '-',
                {iconCls:'x-tbar-loading', id:'seq-view-loading-'+this.m_Idx, tooltip:'Reload View', 
                    scope: this, handler:function(){this.refresh(); }, region: 'east'//, style: {"position": "relative", "right":"0"} 
                }
            );
        }
        
        var first_graphic = true;
        for( var i = 0; i < this.m_App.m_Views.length; i++ ){
            var view = this.m_App.m_Views[i];
            if( view && view != this && view.isGraphic() ){
                first_graphic = false;
                break;
            }
        }
        var pingTB = function(area) {SeqView.pingClick(area, 'toolbarClick');}
        if( first_graphic ){
            if( this.m_App.m_Toolbar["help"] == true ){
            tbar.push(
                {
                    iconCls: 'xsv-question', 
                    tooltip:'Help', 
                    layout: {type:'vbox'},
                    scope: this, 
                    menu:new Ext.menu.Menu({
                        //layout: 'absolute',
                        //autoWidth: true,
                        defaultOffsets: [-70,0],
                        scope: this,
                        items:[{
                            text: 'Help',
                            iconCls: 'xsv-question', 
                            scope:this,
                            handler: function() {SeqView.showHelpDlg(); pingTB('2-2-10-1');}
                        },{
                            text: 'Link to View', 
                            iconCls: 'xsv-link_to_page',
                            scope: this, 
                            handler: function() {this.m_App.showLinkURLDlg(); pingTB('2-2-10-3');}
                        },{
                            text: 'Feedback', 
                            iconCls: 'xsv-feedback',
                            scope: this, 
                            handler: function() {this.m_App.showFeedbackDlg(); pingTB('2-2-10-0');}
                        },{
                            text: 'About', 
                            //iconCls: 'xsv-feedback',
                            scope: this, 
                            handler: function() {SeqView.showAboutMessage(this.m_Idx); pingTB('2-2-10-2');}
                        }]
                    })
                }
            );
            }
         } else {
            tbar.push(
                {iconCls: 'tb-close', tooltip:'Close', scope: this, handler:function() { this.remove(); }}
            );
        }
        
        var tools = [];
        if (this.m_App.m_Embedded === false) {
            tools.push(this.createCloseTBar());
        } else {
            tools.push({id:'help',qtip: 'Help', handler: function(){ SeqView.showHelpDlg(); }})
        }
        
        this.m_View = this.m_App.addView({
            //collapsible:true, title:'Loading...',
            collapsible:false, header: false,
            tools:tools, view:this, tbar:tbar, html:'<div class="alignment_div" id="'+this.m_DivId+'"/>'
        });
        
        
        Ext.get(this.m_DivId).on({
            //'mousedown' : SeqApp.onGViewMouseDown,//onPanoramaMouseDown,
            //'mouseup' : SeqApp.onGViewMouseUp, //onPanoramaMouseUp,
            //'dblclick':   this.onDblClick,
            'mousemove' : this.onMouseMove,
            'contextmenu':this.onContextMenu,
            scope: this
        });
        
        //new_config['expand'] = '';

        if (this.m_App.m_Embedded === false)
            this.m_Locator = new SeqView.Locator(this, this.m_Color, true);

        this.loadImage(this.m_FromSeq, this.m_LenSeq);
    },
    
//////////////////////////////////////////////////////////////////////////
// loadImage:

    loadImage: function(from,len) {
        this.m_Loading = true; // start loading
        this.m_Width = this.getScreenWidth();
      
        var params = {id: this.m_App.GI, view:'aln', client:'assmviewer', width: this.m_Width, from: from, len:len}
        if (this.m_App.m_AppName && this.m_App.m_AppName.length > 0)
            params.appname = this.m_App.m_AppName;
        var url = this.m_App.m_CGIs.Alignment;
        if (this.m_Expand && this.m_Expand.length>0) params.expand = this.m_Expand;
        this.addURLParams(params);

        // Add all 'data_key' keys from all 'alignment_track's to the 'key' parameter
        // to feed the data source
        var tracks = this.m_App.getTrackObjects();
        var key = params.key || "";
        for (var i = 0; i < tracks.length; ++i) {
            var track = tracks[i];
            if (track.key === 'alignment_track' && track.data_key) {
                if (key) key += ',';
                key += track.data_key;
            }
        }
        if (key) params.key = key;

      
        Ext.getCmp('seq-view-loading-'+this.m_Idx).disable();
        this.m_App.AjaxRequest({url: url, context: this, data: params,
            success:this.checkJobStatus, error:this.loadFailure});      
    }, 

    checkJobStatus: function(data, text, res) {
        if (!this.m_Loading) {
            return;
        }
        var from_cgi = SeqView.decode(data);
        if (from_cgi.job_status) {
            if (from_cgi.job_status == 'failed') {
                this.loadFailure(null, from_cgi.error_message);
            } else if(from_cgi.job_status == 'canceled') {
                this.loadFailure(null, 'Job canceled');
            } else {
                var url = this.m_App.m_CGIs.Alignment + '?job_key=' + from_cgi.job_id
                this.m_App.AjaxRequest.defer(2000,this,[{url:url, context: this,
                        success: this.checkJobStatus, error: this.loadFailure}]);
            }
        } else {
            Ext.getCmp('seq-view-loading-'+this.m_Idx).enable();
            if (from_cgi.error) {
                this.loadFailure(null, from_cgi.error);
            } else if (from_cgi.success === false) {
                this.loadFailure(null, from_cgi.msg);
            } else {
                // If the img_url begins with ? it contains only parameters for ncfetch, so prepend ncfetch URL
                // This is a way to provide reliable URL resolution for embedding. SV-1760
                if (from_cgi.img_url && from_cgi.img_url.charAt(0) == '?') {
                    from_cgi.img_url = this.m_App.m_CGIs.NetCache + from_cgi.img_url;
                }
                this.m_FromCgi = from_cgi;
                this.m_FromSeq =      this.m_FromCgi.from; // got from cgi 0-based
                this.m_LenSeq =       this.m_FromCgi.len;
                this.m_AlgnLen =      this.m_FromCgi.seq_length;
                this.m_ViewPageSize = this.m_LenSeq;
                this.m_Width =        this.m_FromCgi.img_width;
                this.m_Height =       this.m_FromCgi.img_height;
                this.m_Loading =      false; // loaded
    
                var the_div = Ext.get(this.m_DivId);
                var img_el = the_div.first('img');
                if (img_el) {
                    var d = Ext.getDom(img_el);
                    d.src = from_cgi.img_url;
                } else {
                    var tpl = new Ext.Template('<img class="sv-drag sv-highlight sv-dblclick" src="{img_url}">'),
                    img_el = tpl.append(the_div, from_cgi,true);
                }
                //the_div.setStyle('background-image', 'url(' + this.m_FromCgi['img_url'] + ')'); 
                the_div.setStyle('height', this.m_Height+'px' ); 
                //this.updateTitle();
               
                
                if( this.m_TbSlider ){  
                    var slider_range = 100;

                    var range = this.toSeq();
                    this.pushToHistory(range[0], range[1]-range[0],"");
                    var vis_len = range[2];
                              
                    var max_bases_to_show = this.m_App.m_SeqLength;
                    var rightPix = this.m_View.getInnerWidth()-2;
                    var min_bases_to_show = rightPix * SeqView.MinBpp;
                    //var min_bases_to_show = this.m_App.getPanoramaWidth() / 10;
                              
                    var ee = Math.log(max_bases_to_show / min_bases_to_show);
                     
                    var slider_val = slider_range * Math.log(vis_len / min_bases_to_show) / ee;

                    this.m_TbSlider.setValue( 100 - slider_val );
                }
                this.m_App.notifyViewLoaded(this);
            }            
        }
    },
    loadFailure: function(data, res) {
        Ext.MessageBox.show({title:'Image loading error', msg:res, buttons:Ext.MessageBox.OK, icon:Ext.MessageBox.INFO});
        var the_div = Ext.get(this.m_DivId);
        the_div.setStyle('background-image', 'none');
        this.m_View.setTitle("Not available");
    },

//////////////////////////////////////////////////////////////////////////
// onMouseDown:

    onMouseDown: function(e) {
    },

//////////////////////////////////////////////////////////////////////////
// onMouseUp:

    onMouseUp: function(e) {
    },

//////////////////////////////////////////////////////////////////////////
// onMouseMove:

    onMouseMove: function(e) {
        var area = this.hitTest(e.getXY());
        
        var elem = Ext.get( this.m_DivId );
        
        if (area && !this.m_Selection) {
            elem.setStyle('cursor', 'pointer');
            this.m_Selection = new SeqView.AlignSelection(this, area);
        } else if (this.m_Selection) {
            elem.setStyle('cursor', 'default');
            this.m_Selection.remove();
            this.m_Selection = null;
        }
    },

//////////////////////////////////////////////////////////////////////////
// onClick:
    
    onClick: function(e)
    {
        var area = this.hitTest(e.getXY());
        if (area) { // open alignment
            var cur_name = area.name;
            var cur_expand = this.m_Expand;
            var e_array = cur_expand.length > 0 ? cur_expand.split(',') : [];
            var expanded = false;

            for (var i = 0;  i != e_array.length;  i++) {
                if (e_array[i] == cur_name) {
                    expanded = true;
                    delete e_array[i];
                    break;
                }
            }
      
            if (!expanded) e_array.push(cur_name);
            this.m_Expand = e_array.join(',');      
            this.loadImage(this.m_FromSeq, this.m_LenSeq);
        }
    },

    onMouseOut: function(e) {
    },

//////////////////////////////////////////////////////////////////////////
// onContextMenu:

    onContextMenu: function(e) {
        e.preventDefault();  // this prevents the default contextmenu to open in Firefox (linux)
        e.stopPropagation();
        menu = new Ext.menu.Menu();
             
        menu.add({iconCls:'xsv-zoom_plus', text:'Zoom In', scope:this, handler:function() { this.zoomIn();} });
        menu.add({iconCls:'xsv-zoom_minus', text:'Zoom Out', scope:this, handler:function() { this.zoomOut();} });
        menu.add('-');
        menu.add({iconCls:'xsv-zoom_seq', text:'Zoom To Sequence', scope:this, handler:function() { this.zoomSeq();} });
        menu.add('-');
        menu.add({iconCls:'expand_all', text:'Expand All', scope:this, handler:function() { this.expandAll();} });
        menu.add({iconCls:'collapse_all', text:'Collapse All', scope:this, handler:function() { this.collapseAll();} });
        menu.add('-');
        menu.add({iconCls:'prev', text:'Prev Page', scope:this, handler:function() { this.gotoPrev();} });
        menu.add({iconCls:'next', text:'Next Page', scope:this, handler:function() { this.gotoNext();} });
        menu.showAt(e.getXY());
    },

//////////////////////////////////////////////////////////////////////////
// toSeq:
   
    toSeq: function() { 
         return [this.m_FromSeq, this.m_FromSeq + this.m_LenSeq - 1, this.m_LenSeq];
    },
    
//////////////////////////////////////////////////////////////////////////
// updateTitle:
    
    updateTitle: function() {
        var range = this.toSeq();
        var r_range_from = range[0] + 1;
        var r_range_to   = range[1] + 1;

        var title = this.m_App.m_Embedded !== false ? "<a href='#' class='hidden_for_print' id='new_view_link_al"+this.m_App.m_Idx+"' style='float:right;padding-right:7px;'>Open Full View</a>" : 'Alignment View: ';
        title += r_range_from.commify() + ' - ' + r_range_to.commify() + ' (' + range[2].commify() + ' bases shown)';
        this.m_View.setTitle(title);

        var href = Ext.get('new_view_link_al'+this.m_App.m_Idx); 
        if (href) { 
            href.on({ 'click' : this.openFullView,  scope:this });
        }

        this.m_App.updateLocator(this);
    },

//////////////////////////////////////////////////////////////////////////
// hitTest:
    
    hitTest: function(page_xy) {

        var elem_xy = Ext.get( this.m_DivId ).getXY();
        var xx = page_xy[0] - elem_xy[0];// - config['scroll_pix'];
        var yy = page_xy[1] - elem_xy[1];// - config['top_offset'];
        for (a in this.m_FromCgi.checkboxes) {
            var area = this.m_FromCgi.checkboxes[a];
            var the_x = area.x;
            var the_y = area.y;
            var the_w = area.w;
            var the_h = area.h;
            if (xx >= the_x-1 && xx <= the_x+the_w && yy >= the_y-1 && yy <= the_y+the_h) return area; // add extra pixel
        }
        return null;
    },
    
//////////////////////////////////////////////////////////////////////////
// zoomIn:
    
    zoomIn: function() {
    	 var new_len  = this.m_LenSeq / 2;
        var new_from = this.m_FromSeq + new_len / 2;
        this.loadImage(new_from, new_len);
    },

//////////////////////////////////////////////////////////////////////////
// zoomSeq:

    zoomSeq: function( center_seq_pos ){        
        
        if( !center_seq_pos ){
            center_seq_pos = Math.floor( this.m_FromSeq + this.m_LenSeq /2 );
        }

        var new_len  = Math.floor( this.getScreenWidth() * SeqView.MinBpp ); 
        var new_from = Math.floor( center_seq_pos - new_len /2 );
        if( new_from < 0 ){
            new_from = 0;
        }
        if( new_from + new_len > this.m_App.m_SeqLength ){
            new_len = this.m_App.m_SeqLength - new_from;
        }

        this.loadImage( new_from, new_len );
    },
    
//////////////////////////////////////////////////////////////////////////
// zoomOut:

    zoomOut: function() {
        var new_len  = this.m_LenSeq * 2;
        var new_from = this.m_FromSeq - this.m_LenSeq / 2;
   
        new_from = Math.max(0, new_from); // not to exteed the sequence range
        if (new_from + new_len > this.m_AlgnLen) new_len = this.m_AlgnLen - new_from;

        this.loadImage(new_from, new_len);
    },
    
//////////////////////////////////////////////////////////////////////////
// gotoPrev:

    gotoPrev: function() {
   
        var new_from = Math.max(0, this.m_FromSeq - this.m_ViewPageSize);
        //new_to   = Math.min(config['vis_from_seq'] + m_AlignViewPageSize, config['vis_len_seq']);
        //new_len  = new_to - new_from;
   
        this.loadImage(new_from, this.m_LenSeq);
    },
    
//////////////////////////////////////////////////////////////////////////
// gotoNext:

    gotoNext: function() {

        var new_from = Math.min(this.m_FromSeq  + this.m_ViewPageSize - 1, this.m_AlgnLen - this.m_ViewPageSize);
        new_from = Math.max(0, new_from);
        //new_to   = Math.min(new_from+m_AlignViewPageSize, config['seq_length']);
        //new_len  = new_to - new_from;

        this.loadImage(new_from, this.m_LenSeq);
    },  

//////////////////////////////////////////////////////////////////////////
// expandAll:

    expandAll: function() {
        var e_array = [];
   
        for (var a in this.m_FromCgi.checkboxes) 
            e_array.push( this.m_FromCgi.checkboxes[a].name );
   
        this.m_Expand = e_array.join(',');   
        this.loadImage(this.m_FromSeq, this.m_LenSeq);
    },

//////////////////////////////////////////////////////////////////////////
// collapseAll:

    collapseAll: function() {
        this.m_Expand = '';
        this.loadImage(this.m_FromSeq, this.m_LenSeq);
    },
    
    refresh: function(options) {
        if (this.m_VisLenSeq == 0)
            return;
        this.loadImage(this.m_FromSeq,this.m_LenSeq);
    },


//////////////////////////////////////////////////////////////////////////
// syncToLocator:

    syncToLocator: function() {
         if (!this.m_Locator) {
            return;
        }            
        var vis_from, vis_to;
        if (this.m_Locator.m_ResizeRight) { vis_from = this.m_FromSeq; }
        else { vis_from = this.m_App.m_Panorama.toSeq( this.m_Locator.getLeft(true) ); }

        if (this.m_Locator.m_Scroll) { vis_to = vis_from + this.m_LenSeq-1; }// keep length 
        else { vis_to = this.m_App.m_Panorama.toSeq( this.m_Locator.getLeft(true) + this.m_Locator.getWidth()+3 ); }
        this.loadImage(vis_from, vis_to-vis_from+1);
    },
    
    checkLocatorWidth: function(width) {
        ///var len = this.m_App.m_Panorama.toSeq(width+3);
        //return SeqView.MinBpp < len/this.getScreenWidth();
        return true;
    },
    
    openFullView: function() {
        this.m_App.getLinkToThisPageURL('portal');
    },
    
    pushToHistory: function( from, length, title ){
    
        if( this.m_HistIx < 0 ){
            this.m_HistIx = 0;
        }

        var current = { from: from, len: length, title: title };

        if( this.m_HistIx < this.m_History.length ){
            if( 
                this.mf_HistoricalBack
                || ( 
                    Math.abs( current.from - this.m_History[this.m_HistIx].from ) <= 1
                    && current.len == this.m_History[this.m_HistIx].len 
                )
            ){
                this.mf_HistoricalBack = false;
                return;
            }

            if( this.m_HistIx > 0 ){
                this.m_History = this.m_History.slice( this.m_HistIx );
                this.m_HistIx = 0;
            }
            
            this.m_History.unshift( current );
            
        } else {
            this.m_History.push( current );
            this.m_HistIx = this.m_History.length -1;
        }
        this.mf_HistoricalBack = false;
        
        var MAX_HISTORY_LENGTH = 10;
        var mhl = MAX_HISTORY_LENGTH;
        
        if( this.m_History.length > mhl ){
            if( this.m_HistIx < mhl ){
                this.m_History = this.m_History.slice( 0, mhl );
            } else {
                this.m_History = this.m_History.slice( this.m_HistIx -mhl +1, mhl );
                this.m_HistIx = this.m_History.length -1;
            }
        }
        
        this.updateHistoryButtons();
    },

    stepHistory: function( forward ){

        if( forward ){
            if( this.m_HistIx > 0 ){
                this.m_HistIx--;
                this.mf_HistoricalBack = true;
                this.loadImage( this.m_History[this.m_HistIx].from, this.m_History[this.m_HistIx].len ); 
            }
        } else {
            if( this.m_HistIx < this.m_History.length-1 ){
                this.m_HistIx++;
                this.mf_HistoricalBack = true;
                this.loadImage( this.m_History[this.m_HistIx].from, this.m_History[this.m_HistIx].len ); 
            }
        }

        this.updateHistoryButtons();
    },  
    
    updateHistoryButtons: function() {

        var tbar = this.m_View.getTopToolbar();
        if( tbar ){
            var btn_prev = tbar.getComponent( 'histPrev'+this.m_Idx );
            if( btn_prev ){
                var tooltip = '';
                if( this.m_HistIx >= this.m_History.length-1 ){
                    btn_prev.disable();
                    tooltip = 'Back';

                } else {
                    btn_prev.enable();
                    
                    if( this.m_HistIx+1 < this.m_History.length ){
                        tooltip += 'Back to ' + this.m_History[this.m_HistIx+1].title;
                    }
                }
                btn_prev.setTooltip( tooltip );
            }
            
            var btn_next = tbar.getComponent( 'histNext' );
            if( btn_next ){
                var tooltip = '';
                if( this.m_HistIx <= 0 ){
                    btn_next.disable();
                    tooltip = 'Forward';

                } else {
                    btn_next.enable();
                    
                    for( var j = this.m_HistIx-1; j >= 0; j-- ){
                        tooltip += this.m_History[j].title + '<br/>';
                    }
                }
                btn_next.setTooltip( tooltip );
            }
        }
    }
    
    


}) }) ();

/*  $Id: graphview.js 34162 2015-11-16 16:54:24Z borodine $
 * ===========================================================================
 *
 *                            PUBLIC DOMAIN NOTICE
 *               National Center for Biotechnology Information
 *
 *  This software/database is a "United States Government Work" under the
 *  terms of the United States Copyright Act.  It was written as part of
 *  the author's official duties as a United States Government employee and
 *  thus cannot be copyrighted.  This software/database is freely available
 *  to the public for use. The National Library of Medicine and the U.S.
 *  Government have not placed any restriction on its use or reproduction.
 *
 *  Although all reasonable efforts have been taken to ensure the accuracy
 *  and reliability of the software and data, the NLM and the U.S.
 *  Government do not and cannot warrant the performance or results that
 *  may be obtained by using this software or data. The NLM and the U.S.
 *  Government disclaim all warranties, express or implied, including
 *  warranties of performance, merchantability or fitness for any particular
 *  purpose.
 *
 *  Please cite the author in any work or product based on this material.
 *
 * ===========================================================================
 *
 * Authors:  Vlad Lebedev, Maxim Didenko, Victor Joukov
 *
 * File Description:
 *
 */


SeqView.ChunkWidth = 4000;
SeqView.MinBpp = 1/24;
SeqView.PreloadMargin = SeqView.ChunkWidth/10; // load next chunk when the current is with this.m_PreloadMargin to the edge

SeqView.PAN_RIGHT = 1;
SeqView.PAN_LEFT = -1;

/********************************************************************/
//////////////////////////////////////////////////////////////////////
// SeqView.Graphic
/********************************************************************/

SeqView.Graphic = (function() {

    return Ext.extend(SeqView.View, {
    m_PrevCgi:null,
    m_NextCgi:null, // image caching
    m_FromSeq: 0,
    m_LenSeq:  0,
    m_VisFromSeq:0,
    m_VisLenSeq:0,
    m_ScrollPix:0,
    m_Flip:false,
    m_Selection:null,
    m_RangeSelectionSet:[],

    //m_OrphanRangeToolTips is for tracking tooltips that do not have associated range with them any longer
    //due to refresh or unpin
    m_OrphanRangeToolTips: [],

    m_Reflections:null,
    m_SelectedSig:null,
    m_SelectedRangeSet:[],
    m_ScrollPixBeforeLoad:null,
    m_TbSlider: null,
    m_DocMouseMove: null,
    m_DocMouseUp: null,
    m_DocTouchMove: null,
    m_DocTouchUp: null,

//////////////////////////////////////////////////////////////////////////
// constructor:

    constructor: function(app) {
        this.clear();
        SeqView.Graphic.superclass.constructor.apply(this, ['graphical',app]);
        this.m_LenSeq = this.m_App.m_SeqLength;
        this.m_Flip = app.getFlip();
    },
    isGraphic: function() {
        return true;
    },

    canFlip: function() {
        return this.m_App.m_ViewParams.acc_type == 'DNA';
    },

//////////////////////////////////////////////////////////////////////////
// getFlip:
    getFlip: function() {
        return this.m_Flip;
    },

//////////////////////////////////////////////////////////////////////////
// getSelectionTop:
    getSelectionTop: function() {
        // right from the top
        return 0;
    },

//////////////////////////////////////////////////////////////////////////
// getSelectionHeight:
    getSelectionHeight: function() {
        // down to the bottom
        return this.m_Height;
    },

//////////////////////////////////////////////////////////////////////////
// setFlip:
    setFlip: function(flip) {
        if (flip != this.m_Flip) {
            this.setFlipNoReload(flip);
            this.refresh();
        }
    },

//////////////////////////////////////////////////////////////////////////
// setFlipLocal:
    setFlipLocal: function( flip ){

        if( flip != this.m_Flip ){
            this.m_Flip = flip;
            var button = Ext.getCmp( 'flip-button-' + this.m_Idx );
            if( button ) button.toggle( flip );
            this.refresh();

            var range = this.toSeq();
            this.pushToHistory( '', range[0], range[2], this.getFlip() );
        }
    },

//////////////////////////////////////////////////////////////////////////
// setFlipNoReload:
    setFlipNoReload: function(flip,no_broadcast) {
        this.m_Flip = flip;
        var button = Ext.getCmp('flip-button-' + this.m_Idx);
        if (button) button.toggle(flip);
        if (typeof no_broadcast == "undefined" || !no_broadcast) {
            // Propagate to the peer views
            var this_view = this;
            this.m_App.setFlip(flip, this_view);
        }
    },

//////////////////////////////////////////////////////////////////////////
// getMostRightPix:

    getMostRightPix: function() {
        //var rpos = this.getFlip() ? this.m_VisFromSeq-0.5 : this.m_VisFromSeq+this.m_VisLenSeq-1;
        //rpos = this.seq2Pix(rpos) + this.m_ScrollPix;
        //return rpos;
        return this.m_View.getInnerWidth()-2;
    },


//////////////////////////////////////////////////////////////////////////
// seq2Pix:

    seq2Pix: function(seq_pos) {
        var pos = 0;
        if (this.getFlip()) {
            pos = (this.m_LenSeq - (seq_pos - this.m_FromSeq) - 1 + 0.5) * this.m_bpPix;
        } else {
            pos = (seq_pos - this.m_FromSeq + 0.5) * this.m_bpPix;
        }
        return Math.round(pos);
    },

//////////////////////////////////////////////////////////////////////////
// seq2PixScrolled:

    seq2PixScrolled: function(seq_pos) {
        return this.seq2Pix(seq_pos) + this.m_ScrollPix;
    },

//////////////////////////////////////////////////////////////////////////
// pix2Seq:

    pix2Seq: function(pix_pos, adj) { // screen 2 sequence (gview)
        if (adj === undefined) adj = 0;
        if (this.getFlip()) pix_pos = this.m_Width - pix_pos;   // FIXME
        return  this.m_FromSeq + Math.floor(pix_pos / this.m_bpPix + adj);

    },

    getScreenWidth: function() { return this.m_App.m_Embedded ? this.m_View.getInnerWidth() : this.m_View.getInnerWidth() - 2; },
    getScreenHeight: function() { return this.m_App.m_Embedded ? this.m_View.getInnerHeight() : this.m_View.getInnerHeight() - 2; },
//////////////////////////////////////////////////////////////////////////
// toSeq:

    toSeq: function() { // screen 2 sequence range (more precise calculation required!!!)

        if (!this.m_FromCgi)
            return [this.m_FromSeq, this.m_FromSeq + this.m_LenSeq - 1, this.m_LenSeq];

        // If we positioned exacly as requested and did not move,
        // use exact cached position
        if (this.m_ReqFrom !== undefined && this.m_ReqLen !== undefined)
            return [this.m_ReqFrom, this.m_ReqFrom + this.m_ReqLen - 1, this.m_ReqLen];

        var ppb = this.m_Width / this.m_LenSeq;
        var view_seq_width = Math.floor(this.getScreenWidth()/ppb);

        var from, to;
        if( this.getFlip() ){
            var left = this.m_FromSeq + this.m_LenSeq - 1;
            to = left - Math.round( -this.m_ScrollPix/ppb );
            from = to - view_seq_width +1;

        } else {
            from = this.m_FromSeq + Math.round(-this.m_ScrollPix/ppb);
            to = from + view_seq_width -1;
        }

        if( to >= this.m_App.m_SeqLength ){
            to = this.m_App.m_SeqLength - 1;
        }

        return [from, to, to - from + 1];
    },

//////////////////////////////////////////////////////////////////////////
// createPanel:

    createPanel: function() {
        var pingTB = function(area){
            SeqView.pingClick(area, 'toolbarClick');
        }
        var modeButtHandler = function(b) {
            this.m_slimMode = b.pressed;
            b.setIconClass(b.pressed ? 'xsv-mode_orig' : 'xsv-mode_slim');
            b.setTooltip('Switch to ' + (b.pressed ? 'normal' : 'slim') + ' mode');
            pingTB('2-2-11');
            this.refresh();
        };
        this.m_DivId = 'graphical_id' + this.m_Idx;
        var menu_id = 'theme-id-' + this.m_Idx;
        SeqView.ping({"embedded": this.m_App.m_Embedded});
        if (this.m_App.m_Embedded && this.m_App.m_Embedded == 'minimal') {
            this.m_View = this.m_App.addView({
                layout:'hbox',
                header: false,
                border: false,
                align: 'stretchmax',
                items: [{
                    xtype: 'buttongroup',
                    cls: 'hidden_for_print',
                    columns: 1,
                    width: 24,
                    frame: false,
                    items: [
                        {iconCls: 'xsv-properties', tooltip:'Open Entrez View', scope: this,
                         handler:function(b,e) {this.openFullView(); pingTB('2-2-2');}},
                        {iconCls:'xsv-flip-strands', id:'flip-button-'+this.m_Idx, tooltip:'Flip Sequence Strands',
                         pressed: this.getFlip(), enableToggle:true, hidden: !this.canFlip(),
                         scope: this, handler:function() { this.flipStrand(); pingTB('2-2-7-2');}},
                        {iconCls: 'xsv-zoom_plus', tooltip:'Zoom In', scope:this,
                         handler:function() {this.m_ZoomOP = 'button'; this.zoomIn(); pingTB('2-2-5-1');}},
                        {iconCls: 'xsv-zoom_minus', tooltip:'Zoom Out', scope:this,
                         handler:function() {this.m_ZoomOP = 'button'; this.zoomOut(); pingTB('2-2-5-1');}},
                        {iconCls: 'xsv-zoom_seq', tooltip:'Zoom To Sequence', scope:this,
                         handler:function() {this.zoomSeq(); pingTB('2-2-6');}},
                        {iconCls:'xsv-goto_position', tooltip:'Go To Position/Range', scope: this,
                         handler:function() {this.gotoPositionDlg(); pingTB('2-2-3');}},
                        {iconCls: this.m_slimMode ? 'xsv-mode_orig' : 'xsv-mode_slim', tooltip: 'Switch to ' + (this.m_slimMode ? 'normal' : 'slim') + ' mode',
                         pressed: this.m_slimMode, enableToggle: true, handler: modeButtHandler, scope: this},
                        {iconCls:'x-tbar-loading', tooltip:'Reload View', scope: this,
                         handler:function() {this.refresh(); pingTB('2-2-9');}},
                        {iconCls: 'xsv-config', tooltip:'Configure tracks', scope: this, hidden: (this.m_App.m_NoConfDlg === true || this.m_App.m_PermConfId),
                         handler:function() {this.m_App.showTracksConfigDlg(0); pingTB('2-2-8-0');}},
                        {iconCls: 'xsv-question', tooltip:'Help', scope: this,
                            handler:function() {SeqView.showHelpDlg(); pingTB('2-2-10');}}
                    ]
                },{
                    header: false,
                    border: false,
                    view:this,
                    flex: 1,
                    autoHeight: true,
                    layout: 'fit',
                    html: {
                        tag: 'div', id: this.m_DivId,
                        cls: 'graphical_div sv-drag sv-highlight sv-dblclick'
                    }
                }]
            });
        } else {
            var tbar = [];
            if (this.m_App.m_Embedded === false) {
                this.m_Spacer = this.m_App.addView({
                    border:false,
                    height:SeqView.View.getSpacerHeight()

                });
                if (!this.m_Color || this.m_Color.length == 0) {
                    var cp = new Ext.ColorPalette();
                    this.m_Color = cp.colors[Math.round( Math.random() * cp.colors.length)];
                }
            }

            var range = this.toSeq();
            var r_range_from = this.m_App.posToLocal(range[0]);
            var r_range_to   = this.m_App.posToLocal(range[1]);
            if( this.getFlip() ){
                var t = r_range_from;
                r_range_from = r_range_to;
                r_range_to = t;
            }

            if( this.m_App.m_Toolbar["history"] == true ){
                tbar.push(
                    {iconCls:'back', tooltip: 'Go back', itemId: 'histPrev'+this.m_Idx, scope:this,
                     handler:function() {this.stepHistory(false, {from_ui: true}); pingTB('2-2-1');}}
                );
            }

            if( this.m_App.m_Toolbar["name"] == true ){
                var tiptitle = '<b>'
                tiptitle += this.m_App.m_ViewParams['id'];
                tiptitle += ': ' + this.m_App.m_Config.SeqInfo.title;
                tiptitle += '</b><br/><br/>';

                tiptitle += r_range_from.commify() + '&nbsp;-&nbsp;' + r_range_to.commify();

                tiptitle += '&nbsp;('+ (range[1] - range[0] + 1).commify() + '&nbsp;';
                tiptitle += (this.m_App.m_ViewParams['acc_type']=='protein' ? 'residues' : 'bases');
                tiptitle += '&nbsp;shown';

                if( this.canFlip() ){
                    if( this.getFlip() ){
                        tiptitle += ',&nbsp;negative strand';
                    } else {
                        tiptitle += ',&nbsp;positive strand';
                    }
                }
                tiptitle += ")";

                var mi_ar_tt_han = function() {
                    if( this.tooltip ){
                        this.tooltip = new Ext.ToolTip( Ext.apply(
                            { target: this.el },
                            Ext.isObject(this.tooltip) ? this.toolTip : { html: this.tooltip }
                        ));
                    }
                };

                var menu_items = [
                    {text: "Entrez View", tooltip: "Switch Entrez View",
                     scope:this,
                     iconCls: 'xsv-full_view',
                     handler: function() {this.openFullView(); pingTB('2-2-2-1');},
                     listeners: {afterrender: mi_ar_tt_han}},
                    {text:'Full View', tooltip:'Switch to full standalone view',
                     scope: this,
                     handler: function() {this.openFullView('full'); pingTB('2-2-2-2');},
                     listeners: { afterrender: mi_ar_tt_han}}
                ];
                if (this.m_App.m_Config.SeqInfo.assm_info) {
                    var wrn = this.m_App.m_Config.SeqInfo.warning_message;
                    menu_items.push({text:'Assembly Info',
                        tooltip: wrn ? 'WARNING! ' + wrn : 'Assembly context information',
                        icon:  SeqView.extPath + 'resources/images/gray/window/icon-' + (wrn ? 'warning.gif' : 'info.gif'),
                        scope: this,
                        handler: function() { this.showAssmInfo(); pingTB('2-2-2-3'); },
                        listeners: { afterrender: mi_ar_tt_han}
                    });
                }

                var linksAdd = function() {
                    if (!this.scope.m_App.m_Config.SeqInfo.links) return;
                    var menu = this.menu;
                    menu.add( '-' );

                    Ext.each(this.scope.m_App.m_Config.SeqInfo.links, function() {
                        var link = SeqView.base_url
                            + '?id=' + this.accession
                            + '&v=' + (this.from + 1) + ':' + (this.to + 1);

                        if (this.label === undefined)
                            this.label = this.accession + ': ' + (this.from + 1) + '..' + (this.to + 1);

                        menu.add({
                            text: this.label,
                            tooltip: this.help,
                            handler: function() { window.open( link ); },
                            listeners: { afterrender: mi_ar_tt_han }
                        });
                     });
                     this.un('click', linksAdd);
                }

                tbar.push({
                    text:"title",
                    tooltip: tiptitle,
                    itemId: 'tbtitle'+this.m_Idx,
                    menu: new Ext.menu.Menu({items: menu_items }),
                    listeners: { click: linksAdd },
                    scope: this
                });
            }
            if (this.m_App.m_Toolbar["search"] == true){
                var buttonSGT = new Ext.Button({
                    text : 'Find:',
                    id: 'sv-goto-btn_' + this.m_Idx,
                    scope: this,
                    handler: function() {this.gotoAndSearch(); pingTB('2-2-3');},
                    tooltip:
                        '<b>Go to position/range:</b><br/>'
                        + 'Range formats are 10k-20k, -20--10, -10k:-5, 5 to 515, -1m..1m <br/><br/>'
                        + '<b>Search:</b><br/>'
                        + 'Feature name, component name, HGVS, SNP rs id, track info, or sequence (nucleotide regexp with IUPAC equivalents, PROSITE patterns)'
                });
                var gotoBox = {
                    xtype:'combo', fieldLabel: 'Go To:', id:'sv-goto-box_'+this.m_Idx, width:150, tooltip:'Go To Position/Range',
                    hidden: true, mode: 'local', store: this.m_App.searchPatternStore,
                    valueField: 'pattern', displayField: 'pattern', typeAhead: true, autoSelect: false,
                    listeners: {
                        specialkey: function(f,e){
                            if (e.getKey() == e.ENTER){
                               this.gotoAndSearch();
                               pingTB('2-2-3');
                               e.stopEvent();//to stop propagation affecting other non-SV text fields in the embedded sviewer
                            }
                        }.createDelegate(this)
                    }
                };

                tbar.push(this.m_App.m_ViewParams.acc_type != 'DNA'? {hidden:true} : '-', buttonSGT, gotoBox);
                //smaller footprint of the above "Find on Sequence" button and its text field for cases when browser's width is
                //less than 900 px
                var buttonSearch = new Ext.Button({
                    //text: 'Search',
                    id:'sv-search-btn_'+this.m_Idx,
                    hidden: true,
                    tooltip:
                        '<b>Go to position/range:</b><br/>'
                        + 'Range formats are 10k-20k, -20--10, -10k:-5, 5 to 515, -1m..1m <br/><br/>'
                        + '<b>Search:</b><br/>'
                        + 'Feature name, component name, HGVS, SNP rs id, track info, or sequence (nucleotide regexp with IUPAC equivalents, PROSITE patterns)',
                    iconCls: 'xsv-search-button',
                    handler: function() { this.m_App.showSearchParamsDlg(this); pingTB('2-2-3');},
                    scope: this
                });
                tbar.push(buttonSearch,'-');
            }

            if( this.m_App.m_Toolbar["panning"] == true ){
                tbar.push(
                    {iconCls:'pan-left', tooltip: 'Pan left', scope:this,
                     handler:function() {this.scrollViewTo( this.m_ScrollPix + 100, SeqView.PAN_LEFT); pingTB('2-2-4');}},
                    {iconCls:'pan-right', tooltip: 'Pan right', scope:this,
                     handler:function() {this.scrollViewTo( this.m_ScrollPix - 100, SeqView.PAN_RIGHT); pingTB('2-2-4');}},
                    '-'
                );
            }

            if( this.m_App.m_Toolbar["zoom"] == true ){
                tbar.push(
                    {text: '&nbsp;&nbsp;-&nbsp;&nbsp;', scale: 'small', tooltip:'Zoom Out', scope: this,
                     handler: function() {this.m_ZoomOP = 'button'; this.zoomOut(); pingTB('2-2-5-1');}}
                );

                this.m_TbSlider = new Ext.Slider({
                    name: 'zoom', width: 100,
                    minValue: 0, maxValue: 100, value: 0, increment: 5,
                    topThumbZIndex: 100,
                    tipText: function(thumb){ return String(thumb.value) + '%'; },
                    listeners: {
                        changecomplete: function(el,val) {
                            pingTB('2-2-5');
                            var slider_range = 100;
                            var slider_val = 100 - val;

                            var vis_range = this.toSeq();
                            var zoom_point = vis_range[0] + vis_range[2] / 2;

                            var max_bases_to_show = this.m_App.m_SeqLength;
                            var min_bases_to_show = this.getMostRightPix() * SeqView.MinBpp;

                            var ee = Math.log(max_bases_to_show / min_bases_to_show);

                            var slider_val = Math.min(slider_range, Math.max(0, slider_val));

                            var len = min_bases_to_show * Math.exp(ee * slider_val / slider_range);
                            var from = zoom_point - len / 2;

                            len = Math.min(this.m_App.m_SeqLength, Math.round(len));
                            from = Math.round( Math.max(0, from) );
                            if (from + len > this.m_App.m_SeqLength) {
                                var extra = from + len - this.m_App.m_SeqLength;
                                from -= extra;
                            }
                            this.m_ZoomOP = 'slider';
                            this.startImageLoading(from, len, {from_ui: true});

                        }.createDelegate(this)
                    }
                });
                tbar.push( this.m_TbSlider );

                tbar.push(
                    {text: '&nbsp;&nbsp;+&nbsp;&nbsp;', scale: 'small', tooltip: 'Zoom In', scope: this,
                     handler:function() {this.m_ZoomOP = 'button'; this.zoomIn(); pingTB('2-2-5-1');}},
                    {iconCls: 'xsv-zoom_seq', tooltip: 'Zoom To Sequence', scope: this,
                     handler:function() {this.zoomSeq(); pingTB('2-2-6');}}
                );
            }



            tbar.push('->',
                {id:'seq-view-sync' + this.m_Idx, hidden: this.m_App.m_NeedAlignmentView == false, text: 'Sync Alignment View', scope: this,
                 handler: function(){this.m_App.onSyncAlignView(this);} },
                {iconCls: 'xsv-full_view', tooltip:'Open Entrez View', scope: this, hidden: (this.m_App.m_Embedded === true || this.m_App.m_NoViewHeader !== true),
                 handler: function(b,e){this.openFullView();}}
            );

            if (this.m_App.m_Toolbar["tools"] == true) {
                var menu_items = [
                    {text:'Go To', iconCls:'xsv-goto_position', tooltip:'Go To Position/Range', scope: this,
                     handler:function(){this.gotoPositionDlg(); pingTB('2-2-7-0');}},
                    {text:'Search', iconCls:'search', tooltip:'Search features, components or sequences', scope: this,
                     handler:function(){this.m_App.showSearchParamsDlg(this); pingTB('2-2-7-1');}},
                    {text:'Flip Strands', id:'flip-menu-'+this.m_Idx, tooltip:'Flip Sequence Strands', iconCls:'xsv-flip-strands',
                     pressed: this.getFlip(), enableToggle:true, hidden: !this.canFlip(), scope: this,
                     handler:function(){this.flipStrand(); pingTB('2-2-7-2');}},
                    {text:'Markers', iconCls:'xsv-markers', scope:this,
                     handler:function(){this.m_App.showMarkersDlg(this); pingTB('2-2-7-3');}},
                    {text:'Set Origin', iconCls:'xsv-origin', scope:this,
                     handler:function(){this.m_App.showOriginDlg(null); pingTB('2-2-7-4');}},
                    {text:'Sequence Text View', iconCls:'xsv-new_fasta', tooltip:'Create New Sequence Text View', scope: this,
                     handler:function(){this.m_App.createTextView(this); pingTB('2-2-7-5');}}
                ];

                if( this.m_App.mf_MultiPanel ){
                    menu_items.push(
                        '-',
                        {text:'Add new Panel', iconCls:'xsv-new_view', tooltip:'Create New Graphical Panel', scope:this,
                        handler:function() {
                            var view = new SeqView.Graphic(this.m_App);
                            this.m_App.registerView(view);
                            pingTB('2-2-7-6');}
                        },

                        {text:'Add new Panel on Range', iconCls:'xsv-new_view', tooltip:'Create New Graphical Panel on Selected Range',
                            scope:this, handler:function() {
                                var view = new SeqView.Graphic(this.m_App);
                                this.m_App.registerView(view);

                                var from = -1, to = -1;
                                var range = this.getTotalSelectedRange();
                                if( range[0] !== -1 && range[1] !== -1 ){
                                    from = range[0];
                                    to   = range[1];
                                    this.removeRangeSelection(true);

                                } else if( this.m_UrlFrom ){
                                    from = this.m_UrlFrom;
                                    to   = this.m_UrlTo;
                                } else {
                                    from = this.m_VisFromSeq + 1;
                                    to   = this.m_VisFromSeq + this.m_VisLenSeq;
                                }

                                if( from !== -1 && to !== -1 ){
                                    view.startImageLoading(from, to - from + 1, {from_ui: true});
                                }
                                pingTB('2-2-7-7');
                            }
                        }
                    );
                }
                var noPBlast = (this.m_App.m_ViewParams['acc_type'] !== 'DNA');
                menu_items.push(
                    '-',
                    {text:'BLAST and Primer Search', menu:new Ext.menu.Menu({items:[

                    {text:'BLAST Search (Visible Range)', iconCls:'xsv-blast', scope: this,
                     handler: function() {
                        this.m_App.blast([this.m_VisFromSeq, this.m_VisFromSeq + this.m_VisLenSeq - 1]);
                        pingTB('2-2-7-8-0');}},
                    {text:'Primer BLAST (Visible Range)', iconCls:'xsv-primer', scope: this, disabled: noPBlast,
                     handler: function() {
                        this.primerBlast(false, [ [this.m_VisFromSeq, this.m_VisFromSeq + this.m_VisLenSeq - 1] ]);
                        pingTB('2-2-7-8-1');}},
                    {text:'BLAST Search (Selection)', iconCls:'xsv-blast', scope: this,
                     handler: function() {this.blastSelection(); pingTB('2-2-7-8-2');}},
                    {text:'Primer BLAST (Selection)', iconCls:'xsv-primer', scope: this, disabled: noPBlast,
                     handler: function() {this.primerBlast(); pingTB('2-2-7-8-3');}}
                    ]})},
                    '-',
                    {text:'Download', iconCls:'xsv-download-static',
                     menu:new Ext.menu.Menu({items:[
                        {text:'FASTA (Visible Range)', scope: this,
                         handler:function() {pingTB('2-2-7-9-0'); this.downloadData(false, "fasta", null);}},
                        {text:'FASTA (All Selections)', scope: this,
                         handler:function() {pingTB('2-2-7-9-1'); this.downloadData(true, "fasta", null);}},
                        {text: 'GenBank Flat File (Visible Range)', scope: this,
                         handler: function() {pingTB('2-2-7-9-2'); this.downloadData(false, "flat", null);}},
                        {text:'GenBank Flat File (All Selections)', scope: this,
                         handler:function() {pingTB('2-2-7-9-3'); this.downloadData(true, "flat", null);}},
                        {text:'PDF file', disabled: this.m_App.m_NoPDF, scope: this,
                         handler:function() {pingTB('2-2-7-9-4'); this.downloadPDF();}}
                    ]})},
                    '-',
                    {text:'Printer-Friendly PDF', iconCls:'xsv-printer', disabled: this.m_App.m_NoPDF, scope: this,
                        handler: function() {pingTB('2-2-7-10'); this.downloadPDF();}},
                    {text: 'Preferences', iconCls: 'xsv-configure', scope: this,
                        handler: function() {pingTB('2-2-7-11'); this.setPreferences();}}
                );

                var tools_menu = new Ext.menu.Menu({ items: menu_items });

                tbar.push({
                    text:'Tools', iconCls:'xsv-tools', tooltip:'Tools', id:'sv-tools-btn_'+this.m_Idx,
                    handler: function() {pingTB('2-2-7');},
                    menu: tools_menu
                 });
            }

            if (this.m_App.m_Toolbar["modeswitch"] == true) {
                var slimModeButt = new Ext.Button({
                    iconCls: this.m_slimMode ? 'xsv-mode_orig' : 'xsv-mode_slim',
                    tooltip: 'Switch to ' + (this.m_slimMode ? 'normal' : 'slim') + ' mode',
                    pressed: this.m_slimMode,
                    enableToggle: true,
                    handler: modeButtHandler,
                    scope: this
                });
                tbar.push(slimModeButt);
            }
            var cfgButt = {text: 'Tracks', iconCls: 'xsv-config', tooltip:'Configure tracks', scope: this, 
                           handler: function(e) {
                                pingTB('2-2-8' + (e.parentMenu ? '-0' : ''));
                                this.m_App.showTracksConfigDlg(0);
                    }};
            var cfgPanel = (this.m_App.m_NoConfDlg !== true
                         && !this.m_App.m_PermConfId
                         && this.m_App.m_Toolbar["config"] == true);
            this.m_App.m_Toolbar["trackSets"] = (TMS.TrackSets != undefined && this.m_App.m_AppContext != null);
            if (this.m_App.m_Toolbar["trackSets"] == true) {
                var icon = 'xsv-search-loading';
                var stdID = 'sv_stdtrackset_id' + this.m_Idx + '_' + this.m_App.m_Idx;
                var menu_items = [];
                if (cfgPanel) {
                    menu_items.push(
                        {text: 'Configure tracks', tooltip: 'Configure current set of tracks', scope: this,
                        iconCls: 'xsv-config', handler: cfgButt.handler}, '-');
                }
                cfgButt.handler = function(butt) {
                    if (butt.menu.hidden) return;
                    pingTB('2-2-8');
                    if (!SeqView.requestTrackSets) {
                        delete this.m_App.m_currentTrackSetId;                        
                        SeqView.configureTrackSets(this.m_App);
                    }
                    var cmp = Ext.getCmp(stdID).disable();
                    cmp.setIconClass(icon);
                    cmp.menu.removeAll();
                    cmp = cmp.nextSibling().disable();
                    cmp.setIconClass(icon);
                    cmp.menu.removeAll();
                    var view = this;
                    SeqView.requestTrackSets(function(s) { view.processTrackSets(s, stdID); });
                };
                menu_items.push({text: 'NCBI Recommended Track Sets', id: stdID,
                                iconCls: icon, menu: new Ext.menu.Menu({items: []}), disabled: true},
                                {text: 'My NCBI Track Collections',
                                iconCls: icon, menu: new Ext.menu.Menu({items: []}), disabled: true},
                                {text: 'FAQ',
                                iconCls: 'xsv-question', handler: function() {
                                    SeqView.pingClick('2-2-8-3', 'goto_FAQ_page');
                                    window.open(SeqView.NCBI.host_url + '/tools/sviewer/faq/#tracksets');}});
                cfgButt.menuAlign = 'tr-br?';
                cfgButt.menu = new Ext.menu.Menu({ items: menu_items });
                tbar.push('-', cfgButt);
            } else if (cfgPanel) tbar.push('-', cfgButt);

            if (this.m_App.m_Toolbar["reload"] == true){
                tbar.push(
                    {iconCls:'x-tbar-loading', id:'seq-view-loading-'+this.m_Idx, tooltip:'Reload View',
                     scope: this, handler:function(){this.refresh(); pingTB('2-2-9');}}
                );
            }

            var first_graphic = true;
            for (var i = 0; i < this.m_App.m_Views.length; i++) {
                var view = this.m_App.m_Views[i];
                if (view && view != this && view.isGraphic()) {
                    first_graphic = false;
                    break;
                }
            }
            if (first_graphic) {
                if( this.m_App.m_Toolbar["help"] == true ){
                    tbar.push(
                        {iconCls: 'xsv-question',
                         tooltip:'Help',
                         layout: {type:'vbox'},
                         scope: this,
                         handler: function() {pingTB('2-2-10');},
                         menu: new Ext.menu.Menu(
                            {defaultOffsets: [-70,0], scope: this,
                             items: [
                                {text: 'Help', iconCls: 'xsv-question', scope:this,
                                 handler: function() {SeqView.showHelpDlg(); pingTB('2-2-10-1');}},
                                {text: 'Link to View', iconCls: 'xsv-link_to_page', scope: this,
                                 handler: function() {this.m_App.showLinkURLDlg(); pingTB('2-2-10-3');}},
                                {text: 'Feedback', iconCls: 'xsv-feedback', scope: this,
                                 handler: function() {this.m_App.showFeedbackDlg(); pingTB('2-2-10-0');}},
                                {text: 'About', scope: this,
                                 handler: function() {SeqView.showAboutMessage(this.m_Idx); pingTB('2-2-10-2');}}
                            ]})
                        }
                    );
                }
            } else {
                tbar.push(
                    {iconCls: 'tb-close', tooltip:'Close', scope: this, handler:function() { this.remove(); }}
                );
            }

            var tools = [];
            if (this.m_App.m_Embedded === false) {
                tools.push(this.createCloseTBar());
            } else {
                tools.push({id:'help',qtip: 'Help', handler: function(){pingTB('2-2-10-1'); SeqView.showHelpDlg();}})
            }

            this.m_View = this.m_App.addView({
                collapsible:true, title:'Loading...', header: false, //this.m_App.m_NoViewHeader !== true,
                tools:tools, view:this, tbar:tbar,
                html: {
                    tag: 'div', id: this.m_DivId,
                    cls: 'graphical_div sv-drag sv-highlight sv-dblclick'
                }
            });
        }

        Ext.get(this.m_DivId).on({
            'mousedown':  this.onMouseDown,
            'touchstart':  this.onMouseDown,
            'touchend':    this.onMouseUp,
            'dblclick':   this.onDblClick,
            'mousemove':  this.onMouseMove,
            'touchmove':  this.onMouseMove,
            'contextmenu':this.onContextMenu,
            'doubletap':this.onContextMenu,
            //'mouseout':   this.onMouseOut,
            scope: this
        });

        this.startImageLoading(this.m_FromSeq, this.m_LenSeq, {fire_event:false});
        // Fixes combobox bug(ExtJS?) -- incorrect combobox initialization while being on invisible page.
        if (gotoBox) Ext.getCmp('sv-goto-box_' + this.m_Idx).getResizeEl().setWidth(150);


    },

    processTrackSets: function(sets, stdID) {
        var scope = this;
        var prepareTT = function() {
            var tt = this.tt;
            if (!tt) {
                if (this.type == 'default') {
                    this.tracks = scope.m_App.m_defaultTrackSet || '[amend]';
                }
                if (typeof this.tracks == 'string') return;
                Ext.each(this.tracks, function(t, i) {
                    tt += (i%2 ? '<p>' : '<p style="background-color:gainsboro;">') + t.GetName() + '</p>'; 
                });
            }
            this.tooltip = new Ext.ToolTip({target: this.el, title: this.text, html: tt,
                anchor: 'top', anchorOffset: 85, trackMouse: true, dismissDelay: 0}); 
        }
        var usrSets = [];
        var tmsSets = [{text: 'Reset to Default Tracks',
                        type: 'default', tsId: 'defaultTS', tt: '', 
                        handler: function() { scope.applyTrackSet(this); },
                        listeners: { afterrender: prepareTT }}];
        Ext.each(sets, function() {
            var tSet = {text: this.GetName(),
                        tracks: this.GetTracks(), tt: '', tsId: this.GetId(),
                        handler: function() { scope.applyTrackSet(this); },
                        listeners: { afterrender: prepareTT }};
            switch (this.GetTrackSetType()) {
                case TMS.TrackSetType.TMS: tmsSets.push(tSet); tSet.type = 'tms'; break;
                case TMS.TrackSetType.myNCBI_Collection: usrSets.push(tSet); tSet.type = 'MyNCBI'; break;
            }
        });

        var cmp = Ext.getCmp(stdID).enable();;
        var addMenuItem = function() {
            if (scope.m_App.m_currentTrackSetId == this.tsId) this.iconCls = 'xsv-search-results';
            cmp.menu.addMenuItem(this);
        }
        cmp.setIconClass('xsv-seq-logo');
        Ext.each(tmsSets, addMenuItem);
        cmp = cmp.nextSibling().enable();
        cmp.setIconClass('xsv-seq-logo');
        if (usrSets.length) {
            Ext.each(usrSets, addMenuItem);
            cmp.menu.addSeparator();
        }
        var inMyNCBI = MyNCBI.User.IsLoggedIn();
        cmp.menu.addMenuItem({text: !inMyNCBI ? 'Sign in to NCBI' : 'Manage collections',
                handler: function(){ 
                    SeqView.pingClick('2-2-8-2', inMyNCBI ? 'NCBI_sign_in' : 'collections_manage');
                    window.open(SeqView.NCBI.host_url + '/myncbi/collections');}});
        if (inMyNCBI)
            cmp.menu.addMenuItem({text: 'Save current tracks', handler: function() { scope.saveTrackSet(); }});
    },

    saveTrackSet: function() {
        var idList = [],
            dOpts = {};

        SeqView.pingClick('2-2-8-1', 'saveTrackSet');
        Ext.each(this.m_App.getActiveTracks(), function() {
            dOpts[this.id] = SeqView.TM.getTrackDisplayOptions(this).slice(0);
            idList.push(this.id);
        });
        if (!idList.length) return;
        TMS.GetTracksById(idList).done(function(){
            var tracklist = this;
            Ext.MessageBox.prompt('Save Track Collection', 'Please enter collection name:', function(btn, name) {
                if (btn!='ok'  || name.length==0) return;
                var tracks = [];
                Ext.each(tracklist.GetTracks(), function() {
                    var dti = new TMS.DisplayTrackInfo(this);
                    dti.SetDisplayOptions(dOpts[this.GetTMSId()]);
                    tracks.push(dti);
                });

                TMS.TrackSets.TrackSetService.CreateTrackset(name, tracks).done(function(trackset_id) {
                    console.log('trackset ' + trackset_id + 'has been added');
                });

            });
       });
    },

    applyTrackSet: function(tSet) {
        var trx = (typeof tSet.tracks == 'string') ? tSet.tracks : '';
        SeqView.ping({area: '2-2-8-' + tSet.type,
                     'sv-event' : 'applyTrackSet', trackSetID : tSet.tsId});
        if (!trx)
            Ext.each(tSet.tracks, function() {
                var opts = this.GetDisplayOptions();
                trx += '[id:' + this.GetTMSId() + (opts ? ',' + opts : '') + ']';
            });
        this.loadTrackSet(trx, tSet.tsId);
    },
    
    loadTrackSet: function(tracks, tsId) {
        var app = this.m_App;
        app.m_TracksFromURL = tracks;
        app.m_currentTrackSetId = tsId;
        var load_cmp = Ext.getCmp('seq-view-loading-' + this.m_Idx).disable();

        app.m_Config.load({forcereload: true,
                callback: { scope: this,
                    success: function(res){ app.fireEvent('configuration_changed', app); this.refresh(); },
                    failure: function(data, text, res) { load_cmp.enable(); app.infoFailed(data, text, res); }
                }
        });
    },

    clear: function() {
        this.m_History = [];
        this.m_HistIx = 0;
        this.mf_HistoricalBack = false;

        this.m_Selection = null;
        this.m_RangeSelectionSet = [];
        this.m_Reflections = null;
        this.m_SelectedSig = null;
        this.m_SelectedRangeSet = [];

        if( this.m_App){
            this.m_App.fireEvent( 'selection_changed', this );
        }

        this.m_ScrollPixBeforeLoad = null;
        this.m_Loading = false;
        if (this.ToolTipsMgr) {
            this.ToolTipsMgr.clear();
            this.ToolTipsMgr = null;
        }
        if (this.SelectedRangeToolTipsMgr) {
            this.SelectedRangeToolTipsMgr.clear();
            this.SelectedRangeToolTipsMgr = null;
        }
        if (this.MarkerToolTipsMgr) {
            this.MarkerToolTipsMgr.clear();
            this.MarkerToolTipsMgr = null;
        }
        SeqView.Graphic.superclass.clear.call(this);
    },

//////////////////////////////////////////////////////////////////////////
// refresh:

    refresh: function(options) {
        if (this.m_VisLenSeq == 0)
            return;
        this.startImageLoading(this.m_VisFromSeq, this.m_VisLenSeq, options);
    },

    // remove hover selection decoration
    removeFloatingSelection: function() {
       if (this.m_Selection) {
           this.m_Selection.remove();
           this.m_Selection = null;
       }
    },

    selectRange: function(sel_range) {
        this.removeRangeSelection(true);
        this.m_SelectedRangeSet = [sel_range];
        this.m_RangeSelectionSet = [new SeqView.RangeSelection(this, sel_range)];

        this.m_App.fireEvent('selection_changed', this);
    },

    selectRangeSet: function(range_set) {
        if (!range_set || !range_set.length) return;
        this.removeRangeSelection(true);
        //this.removeSelectionsWithNoPinnedToolTips();
        this.m_SelectedRangeSet = range_set;
        this.m_RangeSelectionSet = [];
        var l = range_set.length;
        for (var x = 0; x < l; x++) {
            this.m_RangeSelectionSet.push(new SeqView.RangeSelection(this, range_set[x]));
        }

        this.m_App.fireEvent( 'selection_changed', this );
    },
    //removes RangeSelections and SelectedRangeSets when no pinned range tooltip associated with them
    removeSelectionsWithNoPinnedToolTips: function() {
        var new_RangeSelectionSet = [];
        var new_SelectedRangeSet = [];
        var l = this.m_RangeSelectionSet.length;
        for (x = 0; x < l; x++)
        {
            if (this.m_RangeSelectionSet[x].m_ToolTip.isPinned())
            {
                new_RangeSelectionSet.push(this.m_RangeSelectionSet[x]);
                var ll = this.m_SelectedRangeSet.length;
                for (y = 0; y < ll; y++)
                {
                    var selRange = this.m_SelectedRangeSet[y];
                    if (selRange[0] == this.m_RangeSelectionSet[x].range[0] && selRange[1] == this.m_RangeSelectionSet[x].range[1])
                    {
                        new_SelectedRangeSet.push(this.m_SelectedRangeSet[y]);
                    }
                }
                var orphan_l = this.m_OrphanRangeToolTips.length;
                var match = false;
                for(z = 0;z<orphan_l; z++) {
                    if (this.m_OrphanRangeToolTips[z].range[1] == this.m_RangeSelectionSet[x].m_ToolTip.range[1] && this.m_OrphanRangeToolTips[z].range[0] == this.m_RangeSelectionSet[x].m_ToolTip.range[0])
                    {
                        match = true;
                        break;
                    }

                }
                if (!match) this.m_OrphanRangeToolTips.push(this.m_RangeSelectionSet[x].m_ToolTip);

            }
            else if (!this.m_RangeSelectionSet[x].m_ToolTip.isPinned())
            {
                this.m_RangeSelectionSet[x].remove();
                this.m_RangeSelectionSet[x].m_ToolTip.remove();
                var ll = this.m_SelectedRangeSet.length;
                for (y = 0; y < ll; y++)
                {
                    var selRange = this.m_SelectedRangeSet[y];
                    if (selRange[0] == this.m_RangeSelectionSet[x].range[0] && selRange[1] == this.m_RangeSelectionSet[x].range[1])
                    {
                        this.m_SelectedRangeSet[y].remove();
                    }
                }
            }
        }
        this.m_RangeSelectionSet = [];
        this.m_RangeSelectionSet = this.m_RangeSelectionSet.concat(new_RangeSelectionSet);
        this.m_SelectedRangeSet = [];
        this.m_SelectedRangeSet = this.m_SelectedRangeSet.concat(new_SelectedRangeSet);

        this.m_App.fireEvent( 'selection_changed', this );
    },
    // remove range selection
    removeRangeSelection_2: function(range) {
        var sel_set = this.m_RangeSelectionSet;
        if (!sel_set || !sel_set.length) return;
        var l = sel_set.length;
        if (typeof(range) !== 'undefined') {
            for (x = 0; x < l; x++) {
                if (sel_set[x].range == range) {
                    sel_set[x].remove();

                    var ll = this.m_SelectedRangeSet.length;
                    for (y = 0; y < ll; y++)
                    {
                        var selRange = this.m_SelectedRangeSet[y];
                        if (selRange[0] == sel_set[x].range[0] && selRange[1] == sel_set[x].range[1])
                        {
                            this.m_SelectedRangeSet[y].remove();
                            this.m_SelectedRangeSet.splice(y,1);
                            break;
                        }
                    }
                    sel_set.splice(x, 1);
                    break;
                }
            }

            this.m_App.fireEvent( 'selection_changed', this );
        }

    },

    // remove range selection decoration, and, if 'permanent' is true, range
    // object if second parameter given, only this element will be removed
    removeRangeSelection: function(permanent, range) {
        var sel_set = this.m_RangeSelectionSet;
        if (!sel_set || !sel_set.length) return;
        var l = sel_set.length;
        if (typeof(range) !== 'undefined') {
            this.popRangeElement(range, permanent);
            range.remove();
        } else {
            for (var x = 0; x < l; x++) {
                if (sel_set[x].m_ToolTip && sel_set[x].m_ToolTip.isPinned()) {
                    var ll = this.m_OrphanRangeToolTips.length;
                    var isOld = false;
                    for (y=0; y<ll;y++) {
                        if (this.m_OrphanRangeToolTips[y].range[0] == sel_set[x].m_ToolTip.range[0]
                            && this.m_OrphanRangeToolTips[y].range[1] == sel_set[x].m_ToolTip.range[1]){
                            isOld = true;
                            break;
                        }
                    }
                    if (!isOld) this.m_OrphanRangeToolTips.push(sel_set[x].m_ToolTip);
                }
                sel_set[x].remove();
            }
            this.m_RangeSelectionSet = [];
            if (permanent) this.m_SelectedRangeSet = [];
        }
        this.m_App.fireEvent('selection_changed', this);
    },

    removeFeatMarks: function() {
        if (this.m_HighLightedFeature) {
            Ext.each(this.m_HighLightedFeature,function(sf) {
                sf.remove();
            });
        }
        delete this.m_HighLightedFeature;
    },

    popRangeElement: function(range_elt, permanent) {
        var sel_set = this.m_RangeSelectionSet;
        var l = sel_set.length;
        var x;
        for (x = 0; x < l; x++) {
            if (sel_set[x] == range_elt) {
                this.m_RangeSelectionSet.splice(x, 1);
                if (permanent)
                    this.m_SelectedRangeSet.splice(x, 1);
                return range_elt;
            }
        }
    },

    startRangeSelection: function(pix_start, ctrl) {
        // this object is for user interaction time only, after
        // selection is finished, it will be properly registered
        // or discarded, see addRangeSelection
        this.m_InDragAction = true;
        new SeqView.RangeSelection(this, [pix_start], true, ctrl);
    },

    addRangeSelection: function(sel_element, range, pixel_width) {
        // TODO: union range with existing ranges
        this.m_InDragAction = false;
        if (pixel_width < 5) {
            sel_element.remove();
        } else {
            sel_element.updateCoords();
            this.m_RangeSelectionSet.push(sel_element);
            this.m_SelectedRangeSet.push(range);
        }

        this.m_App.fireEvent( 'user_changed_selection', this );
    },

    // Subtract this range from existing range selection
    subRangeSelection: function(range) {
        // Not implemented
    },

    getTotalSelectedRange: function() {
        var min_pos = -1;
        var max_pos = -1;
        for (var i = 0, l = this.m_SelectedRangeSet.length; i < l; i++) {
            var range = this.m_SelectedRangeSet[i];
            max_pos = Math.max(max_pos, range[0], range[1]);
            if (min_pos < 0) min_pos = Math.min(range[0], range[1]);
            else min_pos = Math.min(min_pos, range[0], range[1]);
        }
        return [min_pos, max_pos];
    },

    getSelectedRangeSet: function() {
        return this.m_SelectedRangeSet;
    },


//////////////////////////////////////////////////////////////////////////
// startImageLoading_ext:

    startImageLoading_ext: function(options) {
        var from = options.from || this.m_VisFromSeq;
        var len = options.len || this.m_VisLenSeq;
        delete options.len;
        delete options.from;
        if (typeof options.flip != "undefined") {
            this.setFlipNoReload(options.flip);
        }
        var sel = options.sel;
        if (sel) {
            if (sel.range) {
                this.m_SelectedSig = null;
                this.m_SelectedRangeSet = [sel.range];
            } else if (sel.sig) {
                this.removeRangeSelection(true);
                this.m_SelectedSig = sel.sig;
            }

            this.m_App.fireEvent( 'selection_changed', this );
        }
        this.startImageLoading(from, len, options);
    },

    startImageLoading: function(from, len, options){
        this.m_Loading = true;
        this.clearCache();
        this.loadImage(from, len, options);
    },

    // Check that the range fits sequence boundaries,
    // if not, adjust it appropriately
    adjustRequest: function(from, len) {
        if (from < 0) {
            from = 0;
        }
        if (from + len > this.m_App.m_SeqLength) {
            var over = from + len - this.m_App.m_SeqLength;
            from -= over;
            if (from < 0) {
                from = 0;
                len = this.m_App.m_SeqLength;
            }
        }
        return [from, len];
    },

    loadImages: function(url, params, reqNum) {
        this.m_App.m_timeStamps.loadImagesTS = new Date().getTime();

        if (typeof params.tracks == 'string') {
            params.tracks = [params.tracks];
        } else 
            delete params.minheight;
        var iHeight = 0,
            app = this.m_App,
            self = this,
            imgRQs = params.tracks,
            numRQs = params.tracks.length;
        var halfWidth = this.getScreenWidth()/2;
            
        this.m_FromCgi = {areas:[], images:[]};

        var processResponse = function(data, idx) {
            if (reqNum < app.m_ReqNum) return;
            if (!data.job_status) {
                var it = self.m_FromCgi.images[idx] = {img: new Image(), h: data.img_height, data_height: data.data_height, areas: data.areas};
                if (idx == 0) { 
                    self.m_Width = data.img_width;
                    self.m_LenSeq = data.len;
                    self.m_FromSeq = data.from;
                }

                self.m_FromCgi.areas = self.m_FromCgi.areas.concat(data.areas || []);

                if (data.hairlines) {
                    it.hairlines = data.hairlines;
                    data.hairlines.forEach(function(hl){hl.pos = Math.floor(hl.pos);});
                }
                var img_url = data.img_url;
                if (data.img_url && data.img_url.charAt(0) == '?') {
                    img_url = app.m_CGIs.NetCache + data.img_url;
                } 

                it.img_url = it.img.src = img_url;
                it.img.onload = function() {
                    if (--numRQs) return;
                    self.processTracksImages();
                    self.applyResultsOnLoad();
                };
                it.img.empty = (typeof it.areas == 'undefined');
            } else {
                 var jst = data.job_status;
                 if (jst == 'submitted' || jst == 'running' || jst == 'pending') {
                     var cfg = {
                        url: app.m_CGIs.Graphic + '?job_key=' + data.job_id,
                        success: function(d, t, r) { processResponse(d, idx); },
                        error: function(d, t, r) { if (reqNum == app.m_ReqNum) self.loadFailure(t, r); }
                     };
                     SeqView.App.simpleAjaxRequest.defer(2000, self, [cfg]);
                 }
            }
        };

        imgRQs.forEach(function(t, idx){
            params.tracks = t;
            SeqView.App.simpleAjaxRequest({
                url: url, data: params,
                success: function(d, t, r) { processResponse(d, idx); },
                error: function(d, t, r) { if (reqNum == app.m_ReqNum) self.loadFailure(t, r); }});
        });
    },


    loadImage: function(from, len, options){
        if (this.m_featMarkers){
            this.m_featMarkers.div.parentElement.removeChild(this.m_featMarkers.div);
            //this.m_featMarkers.div.remove();
            delete this.m_featMarkers;
        };

        from = Math.floor(Math.max(0,from));
        len = Math.floor(Math.min(len,(this.m_App.m_SeqLength-from)));

        var screen_width = this.getScreenWidth(); // our panel width in pixels

        if ((this.m_App.m_Embedded && screen_width == -2) || screen_width == 0 || !this.m_View.isVisible()) {
            // the view is hidden, just save the visible range.
            // the client will have to call refresh method to load the image
            this.m_VisFromSeq = from;
            this.m_VisLenSeq = len;
            this.m_Loading = false;
            return;
        }

        var req_from = from;
        var req_len = len;

        // Basepairs can not be wider than 1/SeqView.MinBpp (24 pixels per basepair)
        if( req_len < screen_width*SeqView.MinBpp ){
            var new_req_len = Math.floor( screen_width*SeqView.MinBpp );
            if( new_req_len > this.m_App.m_SeqLength ){
                new_req_len = this.m_App.m_SeqLength;
            }
            // we check for range validity and adjust it later
            req_from = Math.floor( req_from - (new_req_len - req_len)/2 );
            req_len = new_req_len;
        }

        // Check that view is detailed, so we can't get away with fractional
        // pixels per basepair. If there are more than 4 pixels per base, bases
        // are becoming individually visible, so fractional ppb will lead to
        // uneven spacing between base letters
        var ppb = screen_width/req_len;
        if (ppb > 4) {
            ppb = Math.floor(ppb);
            var new_req_len = Math.floor(screen_width/ppb);
            if (new_req_len > this.m_App.m_SeqLength) {
                new_req_len = this.m_App.m_SeqLength;
                ppb = screen_width/new_req_len;
            }
            req_len = new_req_len;
        }
        var from_len = this.adjustRequest(req_from, req_len);
        req_from = from_len[0]; req_len = from_len[1];

        var chunk_width;
        if( req_len > 2000000 ){
            chunk_width = 3*screen_width;
        } else if( req_len > 1000000 ){
            chunk_width = 5*screen_width;
        } else {
            chunk_width = 8*screen_width;
        }
        chunk_width = Math.min(SeqView.ChunkWidth, chunk_width);
        // Actually chunk can be little bigger than maximum.

        var fit_len = Math.floor( chunk_width / ppb );

        from = Math.floor( req_from - (fit_len - req_len)/2 );
        len = fit_len;

        var from_len = this.adjustRequest(from, len);
        from = from_len[0]; len = from_len[1];
        chunk_width = len * ppb;

        if (!isNaN(chunk_width)) {
            chunk_width = Math.floor(chunk_width);
        }
         // added some sanity check before calling seqgraphic.cgi
        if (isNaN(from) || isNaN(len) || isNaN(chunk_width) || chunk_width > 16384) {
            // TODO we need to understand why we got in here.
            // Nothing left than just cancel loading and return.
            this.m_Loading = false;
            return;
        }

        this.m_ReqFrom = req_from;
        this.m_ReqLen  = req_len;

        len = Math.max(len, Math.min(this.m_App.m_SeqLength, 100));
        // go for it!!
        var url = this.m_App.m_CGIs.Graphic;
        var params = this.getGraphicParams(from, len, chunk_width);

        if (options && options.data_changed === true) {
            params.data_changed = 'true';
        }
//        params.delaytest = 5;
        var load_cmp = Ext.getCmp('seq-view-loading-'+this.m_Idx);
        if (load_cmp) load_cmp.disable();

        var deferred = this.showLoadingImage.defer( 3*1000, this );

        // remove selection decorations
        this.removeFloatingSelection();
        this.removeRangeSelection();
        this.removeFeatMarks();
        this.m_App.watchdogStart(url, '', params);
        this.m_opts = {opts: options, deferred:deferred};
        var reqNum = ++this.m_App.m_ReqNum;
        
        this.loadImages(url, params, reqNum)

        if (this.m_TbSlider) {
            var slider_range = 100;
            var vis_len = req_len || this.toSeq()[2];
            var min_bases_to_show = this.getMostRightPix() * SeqView.MinBpp;

            var ee = Math.log(this.m_App.m_SeqLength / min_bases_to_show);
            var slider_val = slider_range * Math.log(vis_len / min_bases_to_show) / ee;

            this.m_TbSlider.setValue(100 - slider_val);
        }
    },

    getGraphicParams: function(from, len, width, forPDF) {
        var params = {id: this.m_App.GI, minheight:220, client:'seqviewer', width: width,
                      view_width: this.getScreenWidth(), from:from, len:len};
        Ext.apply(params, this.m_App.m_GraphicExtraParams);

        params.forPDF = forPDF;

        if (this.m_SelectedSig) params.select = this.m_SelectedSig;
        if (this.getFlip()) params.flip = 'true';

        // for statistic only -- should be deleted soon
        if (this.m_ZoomOP) {
            params._zo = this.m_ZoomOP;
            this.m_ZoomOP = null;
        }
        this.addURLParams(params);
        // HACK params.tracks can be either string or array, both if empty have length == 0
        if (!params.tracks.length) params.tracks = '[key:ruler]';

        // markers
        params.markers = this.m_App.m_MarkersInfo.getMarkersData(true, forPDF);

        return params;
    },

    // drawing feature markers
    drawFeatMarkers: function() {
        var div = this.m_featMarkers.div = document.createElement('div');
        var trx = this.m_graphTracks,
            top = trx[0].divT,
            height = this.m_Height - top,
            left = this.m_featMarkers.left;
        div.setAttribute('class', 'sv-drag');
        div.setAttribute('style', 'position: relative; top:' + top
            + 'px; left:' + (left + this.m_ScrollPix)
            + 'px; width:' + this.m_featMarkers.width
            + 'px; height:' + height + 'px;');
        var tmpl = '<div class="sv-drag" id="hairline" style="border-width: 1px; border-left-style: solid; position: absolute;';

        this.m_featMarkers.hls.forEach(function(hls){
            var arrHLs = hls.hairlines;
            for (var idx = trx.length - 1; idx > 0; idx--) {
                if (trx[idx].divT == hls.top) break;
            }
            var tHeight = trx[idx].divT - top,
                bTop = tHeight + trx[idx].imgH,
                bHeight = height - bTop;

            for(var i = 0; i < arrHLs.length; i += 2) {
                 var lHL = arrHLs[i],
                     rHL = arrHLs[i + 1] || lHL,
                     lPos = lHL.pos - left,
                     rPos = rHL.pos - lHL.pos - 1;
                lHL.top_color = (lHL.top_color.r == 255) ? 'red' : 'grey';
                if (typeof rHL.top_color == 'object') rHL.top_color = (rHL.top_color.r == 255) ? 'red' : 'grey';
                if (tHeight)
                    div.innerHTML += tmpl + 'width:' + rPos + 'px; border-right-style:' + (rPos >= 0 ? 'solid' : 'none')
                        + ';border-left-color:' + lHL.top_color + '; border-right-color:' + rHL.top_color
                        + ';opacity: 0.4;top: 0px; height:' + tHeight + 'px; left:' + lPos + 'px;"></div>';
                if (bHeight > 0)
                    div.innerHTML += tmpl + 'width:' + rPos + 'px; border-right-style:' + (rPos >= 0 ? 'solid' : 'none')
                    + '; border-left-color: darkgreen; border-right-color: darkgreen; opacity: 0.7;'
                    + 'top:' + bTop + 'px; height:' + bHeight + 'px; left:' + lPos + 'px;"></div>';
            }
        });

         var view = this;
         div.onmousemove = function(e) {
//             console.log('pageY:', e.pageY,', clientY:', e.clientY,', offsetY:', e.offsetY,', layerY:', e.layerY, ', y:', e.y)
             view.highlightElement([e.pageX , e.pageY ]);
        };
        return div;
    },


    processTracksImages: function(){
        this.m_App.watchdogStop();
        if (!this.m_Loading) return;
        var view = this;
        var data = this.m_FromCgi;
        if (this.m_opts.deferred) clearTimeout(this.m_opts.deferred);

        this.m_Loading = false; // loaded
        this.m_App.notifyViewLoaded(this);


        var load_cmp = Ext.getCmp('seq-view-loading-' + this.m_Idx);
        if (load_cmp) load_cmp.enable();
        var ts = new Date().getTime();
        var appTS = this.m_App.m_timeStamps;
        var stat = {'SV_graphics_time':  ts - appTS.loadImagesTS}
        if (appTS.prior2seqconfig) {
            stat['sv-event'] = 'initialization';
            stat['SV_config_time'] = appTS.loadImagesTS - appTS.prior2seqconfig;
            stat['SV_config_graphics_time'] = ts - appTS.prior2seqconfig;
            delete appTS.prior2seqconfig;
        }
        SeqView.ping(stat);
        
        //adding track names on JS side
        //removing all previously loaded nodes with track names, because track names may have changed after zoom in/out
        var el = Ext.get(this.m_DivId);
        var nodes = el.dom.childNodes;
        for (var i = nodes.length; i > 0;) {
            if (nodes[--i].id.search('marker') != 0) Ext.removeNode(nodes[i]);
        }
        //getting track information
        var tracks = [];
        var trackConfig = this.m_App.m_Config.TrackConfig;
        var slimMode = this.slimMode;
        var lPos = this.m_Width,
            rPos = 0;

        this.m_Height = 0;
        for (var j = 0; j < data.images.length; j++) {
            var image = data.images[j];
            if (image.hairlines && data.images.length > 1) {
                this.m_featMarkers = this.m_featMarkers || {hls: []};
                var arrHLs = image.hairlines;
                arrHLs.sort(function(a, b){return a.pos - b.pos});
                this.m_featMarkers.hls[j] = {hairlines: arrHLs, top: this.m_Height};
                lPos = Math.min(lPos, arrHLs[0].pos);
                rPos = Math.max(rPos, arrHLs[arrHLs.length - 1].pos);
            }
            // if (image.img_url && image.img_url.charAt(0) == '?') image.img_url = this.m_App.m_CGIs.NetCache + image.img_url;
            for (var i = 0; i < image.areas.length; i++) {
                var area = image.areas[i];
                area.bounds.t += this.m_Height;
                area.bounds.b += this.m_Height;
                if (area.type & (SeqView.AreaFlags.Track | SeqView.AreaFlags.Sequence)) {
                    area.bounds.t--; area.bounds.b--; // correction for slim mode???

                    var track = {l: area.bounds.l, imgT: area.bounds.t - this.m_Height, divT: area.bounds.t, display_name: ''};
                    var signature = area.signature; //need to extract second half of the signature
                    if (signature.match(";")) {
                        var arr = [];
                        arr = signature.split(";");
                        signature = arr[0]; //arr[0] is used for track tooltips
                    }
                    track.signature = signature;
                    track.idx = 0;
                    track.image = image;
                    if (area.type & SeqView.AreaFlags.Sequence) {
                        signature = 'Sequence'; //In case of "Zoom to sequence" area.signature = "Sequence strand"
                        var seq_t = area.bounds.t - (Ext.isIE8 ? 10 : -2);
                        var seq_b = area.bounds.b - (Ext.isIE8 ? 10 : 2);

                        //upper sequence 5' label
                        var newEl1 = new Ext.Element(document.createElement('div'));
                        newEl1.insertHtml('afterBegin','<img ext:qtitle="5 \'" ext:qwidth="80" ext:qtip="5 Prime end" src="'
                            + SeqView.base_url + 'images/5prime_r.gif"'
                            + ((Ext.isIE8) ? '>' : (' style="top:' + (-7 + (!this.m_Flip)) +'px; position:absolute;">')));
                        newEl1.applyStyles('position:absolute;z-index:10;left: 0px;opacity:0.6;filter:alpha(opacity=60);top:'
                            + ((!this.m_Flip) ? seq_t : seq_b) +'px;');
                        el.appendChild(newEl1.dom);

                        //bottom sequence 5' label
                        var newEl2 = new Ext.Element(document.createElement('div'));
                        newEl2.insertHtml('afterBegin','<img ext:qtitle="5 \'" ext:qwidth="80" ext:qtip="5 Prime end" src="'
                            + SeqView.base_url + 'images/5prime_l.gif"'
                            + ((Ext.isIE8) ? '>' : (' style="top:' + (-7 + (!this.m_Flip)) +'px; left:-12px; position:absolute;">')));
                        newEl2.applyStyles('position:absolute;z-index:10;right: 0px;opacity:0.6;filter:alpha(opacity=60);top:'
                            + ((!this.m_Flip) ? seq_b : seq_t) +'px;');
                        el.appendChild(newEl2.dom);

                        track.idx = Ext.each(trackConfig, function() { return (this.key != 'sequence_track');});
                        //skip this area since we have one more
                        if (trackConfig[track.idx].check_boxes[0].value) continue; 
                    } else {
                        Ext.each(trackConfig, function(trk, idx) {
                            if (signature != trk.name) return true;
                            track.idx = idx;
                            if (trk.legend) track.legends = trk.legend;
                            if (trk.key != 'sequence_track' || trk.check_boxes[0].value) track.display_name = trk.display_name;
                            return false;
                        });
                    }
                    trackConfig[track.idx].no_navi = (area.type & SeqView.AreaFlags.NoNavigation);
                        
                    if (area.status && area.status.code != 0) track.status = area.status;
                    if (area.bounds.t == area.bounds.b && track.display_name.length) {
                        // slim track (w/o title bar)
                        track.area = area;
                    }
                    tracks.push(track);
                }
            } //for: data.images.areas
            this.m_Height += image.data_height;
        } // for: data.images
        this.m_graphTracks = tracks;
        if (Ext.isIE8) this.m_graphTracks = [];
        var szTrackFont = 12;
        //adding fresh nodes for new track names and track coordinates
        var slimStyle = 'opacity: 0.3; cursor: pointer;';
        if (this.m_featMarkers) {
            this.m_featMarkers.left = lPos;
            this.m_featMarkers.width = rPos - lPos;
        }

        for (i = 0; i < tracks.length; i++){
            var track = tracks[i]; 
            //NB! from_cgi.data_height the sum of track's heights and  <= from_cgi.img_height
            track.imgH = ((tracks[i + 1]) ? tracks[i + 1].divT: this.m_Height) - track.divT;

            if (!tracks[i].display_name) continue;
                var newEl = new Ext.Element(document.createElement('div'));
                var track = tracks[i];
                var displayNameMod = "";
                Ext.each(trackConfig[track.idx].choice_list, function(i_ch_list) {
                    if(i_ch_list.name == "scale") {
                        if(i_ch_list.curr_value != "linear") {
                            Ext.each(i_ch_list.values, function(i_ch_value) {
                                if (i_ch_value.name == i_ch_list.curr_value) {
                                    displayNameMod = i_ch_value.display_name;
                                    return false;
                                }
                            });
                        }
                        return false;
                    }
                });
                newEl.name = track.display_name;
                if (displayNameMod && displayNameMod.length > 0) {
                    newEl.name += " - " + displayNameMod.toLowerCase() + " scaled";
                }
                if (track.status) {
                    var tracks_errors = true;
                    newEl.name += '<div style="color: red; position: relative; top: -5px; font-size:'
                                + (szTrackFont - 2) + 'px; font-family: Arial, san-serif;">Error: '
                                + track.status.msg + '</div>';
                }
                newEl.dom.track_name = "track_" + i;
                newEl.dom.idx = track.idx;
                newEl.insertHtml('afterBegin', newEl.name);
                newEl.addClass(['sv-drag'/*, 'sv-highlight', 'sv-dblclick'*/]);
                el.appendChild(newEl.dom);
                newEl.applyStyles('text-align: left; position: absolute; top:' + track.divT
                                + 'px; left: 0px; font-family: "Monospace", Courier New, serif; font-size: ' + szTrackFont + 'px;'
                                + (track.area ? slimStyle :  ('width:' + this.m_Width +'px;'))
                                + 'overflow: hidden; white-space: nowrap; text-overflow: ellipsis;');
                if (track.area) {
                    track.area.bounds.b += newEl.getHeight();
                    track.area.tname = newEl;
                    track.area.bounds.r = newEl.getComputedWidth();
                    newEl.dom.area = track.area;
                    newEl.on('mouseenter',function(e) {
                        this.removeFloatingSelection();
                        if (e.target.area) {
                            this.m_tnameDiv.setStyle('opacity', 0.3);
                            this.m_tnameDiv = e.target.area.tname;
                            this.m_Selection = new SeqView.Selection(this, [e.target.area]);
                            this.m_tnameDiv.setStyle('opacity', 1);
                        }
                    }, this);
                } else {
                    newEl.on('mouseover',function(e) {
                        this.highlightElement(e.getXY());
                    }, this);
                }
            }

            // adding comment labels for the picture
            for (i = 0; i < data.areas.length; i++) {
                var area = data.areas[i];
                if (area.type & SeqView.AreaFlags.Comment) {
                    var newEl = new Ext.Element( document.createElement('div') );
                    newEl.name = area.label;
                    newEl.dom.track_name="comment_"+ i;
                    newEl.insertHtml('afterBegin', newEl.name);
                    var styles = 'position:absolute; font-family: "Monospace", Courier New, serif; font-size: 12px;';//should always be left:0px;
                    if (area.bounds){
                        if (area.bounds.t) styles += 'top:' + area.bounds.t + 'px;';
                        if (area.bounds.l == -1 ) styles += 'left:' + area.bounds.r + 'px;';
                        if (area.bounds.l == 1) styles += 'right:' + (el.getRight() - area.bounds.r) + 'px;';
                                
                    }
                    if (area.type & SeqView.AreaFlags.DrawBackground) {
                        styles += 'background-color:rgb(180,180,240);opacity:0.6;';
                    }
                    el.appendChild(newEl.dom);
                    newEl.applyStyles(styles);

                    if (area.tooltip) var tip = new Ext.ToolTip({target: newEl, html: area.tooltip});
                    newEl.on('mouseover', function(e) {
                       this.highlightElement(e.getXY());
                    }, this);
                }
            }
            if (tracks_errors) this.m_App.fireEvent('tracks_errors', tracks);
            if (!this.m_Locator && this.m_App.m_Panorama) {
                this.m_Locator = new SeqView.Locator(this, this.m_Color, true);
                this.m_Locator.setColor(this.m_Color);
            }
    },


    loadFailure: function(text, res){
        if (res) this.m_App.watchdogReport(res);
        this.m_View.setTitle('Image loading error: ' + text);
        this.m_Loading = false;
        this.mf_HistoricalBack = false;
    },


    showLoadingImage: function() {
        if (this.m_Loading === true) {
            var the_div = Ext.get(this.m_DivId);
            the_div.mask();
            the_div.setStyle('background-image', 'url(' + SeqView.base_url + 'images/img-loading.gif)' );
            the_div.setStyle('background-position', '50% 50%');

            var img_el = the_div.first('img');
            if (img_el) img_el.hide();

            this.m_LoadingImageShown = true;
        }
    },


    gotoFeature: function(track_idx, dir, callback) {
        callback = callback || function(){};
        this.tmp_gotoFeat = true;
        var vLen = this.m_VisLenSeq,
            vFrom = this.m_VisFromSeq,
            lenSeq = this.m_LenSeq,
            fromSeq = this.m_FromSeq;
        var curMarker = this.m_App.getMarkersInfo().findMarkerByName(SeqView.MarkerNav);
        var sPos = (curMarker) ? curMarker.seq_pos : (vFrom + (vLen >> 1));
        
        var processError = function(data, text, res) {
            delete this.tmp_gotoFeat;
            console.log('gotoFeature error:' + text);
            callback();
       }
        
        var processResponse = function(data, text, res) {
            if (data.job_status) {
                if (data.job_status == 'failed' || data.job_status == 'canceled') {
                    processError(null, data.job_status);
                } else {
                    SeqView.App.simpleAjaxRequest.defer(500, this, [{
                        url: this.m_App.m_CGIs.Graphic + '?job_key=' + data.job_id,
                        context: this,
                        success: processResponse,
                        error: processError}]);
                }
                return;
            }
            if (typeof data.new_pos !== 'undefined') {
                var dPos = data.new_pos;
                var bOpt = {blinkData: {track_idx: track_idx, data: data}};
                var newVisFrom = dPos - (vLen >> 1);
                if (newVisFrom < 0) newVisFrom = 0;
                if ((vLen < this.m_App.m_SeqLength) && (dPos < vFrom || dPos > (vFrom + vLen))) {
                    if (newVisFrom < fromSeq || (fromSeq + lenSeq) < (newVisFrom + vLen)) {
                        this.gotoPosRange([dPos, 0], true, bOpt);
                    } else {
                        var shift = Math.round((vFrom - newVisFrom) * this.m_bpPix);
                        if (!this.scrollViewTo(this.m_ScrollPix + shift, shift < 0 ? SeqView.PAN_RIGHT : SeqView.PAN_LEFT, false, bOpt))
                            this.blinkAreas(bOpt);
                    }
                } else {
                    this.blinkAreas(bOpt);
                }
                if (curMarker) {
                    curMarker.setSeqPos(dPos, false);
                    curMarker.m_ToolTip.updateMarkerToolTipContent(null, curMarker.span, dPos);
                }
                else this.m_App.getMarkersInfo().addMarker([dPos], SeqView.MarkerNav, false, 'navy');
            }
            delete this.tmp_gotoFeat;
            callback();
        }
        var data = {track: SeqView.TM.tracksArrayToString(this.m_App.m_Config.TrackConfig[track_idx], true, true),
                   pos: sPos, select: this.m_SelectedSig, dir: dir, id: this.m_App.GI, navi: 1,
                   from: fromSeq, len: lenSeq, width: this.m_Width};
        Ext.apply(data, this.m_App.m_Config.visualOptionsUrl());
        this.m_App.AjaxRequest({ url: this.m_App.m_CGIs.Graphic, data: data, context: this,
            success: processResponse,
            error: processError});
    },


    blinkAreas: function(options) {
        if (!options || !options.blinkData) return;
        var data = options.blinkData.data;
        if (!data.bounds || !data.bounds.length) return;
        var track, idx = options.blinkData.track_idx;
        Ext.each(this.m_graphTracks, function(t) { track = t; return t.idx != idx; });
        var offset = this.m_FromSeq + (this.m_Flip ? this.m_LenSeq : 0);
        Ext.each(data.bounds, function(db) {
            db.l = Math.abs(Math.round((db.l - offset) * this.m_bpPix));
            db.r = Math.abs(Math.round((db.r - offset) * this.m_bpPix));
            db.t += track.divT + 1;
            db.b += track.divT + 1;
            tpl = new Ext.Template('<div style="position:absolute; border: 1px solid red;"></div>');
            db.elem = SeqView.createSelectionElement(this, {bounds: db}, tpl);
        }, this);
        function blink(bnum){
            Ext.each(data.bounds, function(r) { r.elem.setVisible(bnum % 2); });
            if (bnum-- > 0) { blink.defer(300, this, [bnum]); return; }
            Ext.each(data.bounds, function(r){ track.div.dom.parentNode.removeChild(r.elem.dom); });
        }
        blink(3);
     },

    applyResultsOnLoad: function(data, options){
        this.m_bpPix =  (this.m_Width || SeqView.ChunkWidth)/this.m_LenSeq;
        var the_div = Ext.get(this.m_DivId);

        this.m_LoadingImageShown = false;
        the_div.setStyle('background', '');

        this.m_App.updateMarkersSize(this); // Do that before setting the size of the panel

        var screen_width = the_div.getWidth(); //this.getScreenWidth();
        var off_pix = 0;

        if (this.getFlip()) {
            off_pix = Math.max(0, this.seq2Pix(this.m_ReqFrom - 0.5) - screen_width);
        } else {
            off_pix = Math.min(Math.max(0,this.m_Width - screen_width), this.seq2Pix(this.m_ReqFrom-0.5));
        }

        if (this.m_ScrollPixBeforeLoad){
            var diff = this.m_ScrollPixBeforeLoad - this.m_ScrollPix; // scrolling that happend during request
            this.m_ScrollPixBeforeLoad = null; // reset untill next reload

            this.m_ScrollPix = -off_pix;
            this.m_ScrollPix = this.m_ScrollPix - diff; // add this additional scroll offset
        } else {
            this.m_ScrollPix = -off_pix;
        }
        var chNodes = the_div.dom.childNodes;
        var trackConfig = this.m_App.m_Config.TrackConfig;
        for (var i = chNodes.length - 1; i >= 0; i--) {
            var node = chNodes[i];
            if (typeof node.idx == 'undefined' || !node.textContent || !node.textContent.length) continue;
            if (node.style.opacity || this.m_App.m_PermConfId || Ext.isIE8) continue;
            node.style.width = screen_width + 'px';
            var tpl;
            var no_navi = trackConfig[node.idx].no_navi;
            if (!no_navi) { // to avoid overlapping jump buttons
                tpl = new Ext.Template ('<div style="width:' + ((screen_width >> 1) - 26)
                    + 'px;overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">' + node.textContent + '</div>');
                node.textContent = '';
                tpl.append(node, {}, true).dom;
            }
            // X-button adding
            tpl = new Ext.Template('<button type="button" style="height:13px; width:13px; position: absolute; top:-1px; left:'
                + (screen_width - 13) + 'px; cursor: pointer; background-image: url('+ SeqView.base_url
                + 'images/hide_track_red.gif); padding: 0px;'
                + 'border-radius: 3px; border: 0px; background-color: transparent;'
                + 'background-position:center;background-repeat:no-repeat;z-index:999;" ext:qtip="Hide"></button>');
            var butt = tpl.append(node, {}, true).dom;
            var gview = this;
            butt.onmouseover = function(e) { this.style.border = ''; };
            butt.onmouseout = function(e) { this.style.border = '0px'; };
            butt.onclick = function(e) {
                e.stopPropagation();
                e.preventDefault();
                SeqView.pingClick('2-0-1');
                trackConfig[this.parentNode.idx].shown = false;
                var categories = SeqView.TM.processTracksInfo(trackConfig);
                SeqView.TM.Common.updateSeqViewApp(categories, gview.m_App);
            };
            if (no_navi) continue;

            var img = 'url('+ SeqView.base_url + 'images/jumps.png) ';
            tpl = new Ext.Template('<button type="button" style="height:11px; position: absolute; top:2px; left:'
                + ((screen_width >> 1) - 26) + 'px; cursor: pointer; padding: 0px; border: 0px;'
                + 'border-radius: 1px; z-index:999;" ext:qtip="Jump left"></button>');
            var lButt = tpl.append(node, {}, true).dom;
            tpl = new Ext.Template('<button type="button" style="height:11px; position: absolute; top:2px; left:'
                + ((screen_width >> 1) + 8) + 'px; cursor: pointer; padding: 0px; border: 0px;'
                + 'border-radius: 1px; z-index:999;" ext:qtip="Jump right"></button>');
            var rButt = tpl.append(node, {}, true).dom;;
            lButt.posX = 0; rButt.posX = -18;
            lButt.onmouseover = rButt.onmouseover = function(e) {
                if (gview.tmp_gotoFeat) return;
                this.style.opacity = 0.9;
            }
            lButt.onmouseout = rButt.onmouseout = function(e) {
                if (gview.tmp_gotoFeat) return;
                this.style.width = '18px';
                this.style.opacity = 0.5;
                this.style.background = img + (this.posX + 'px 0px');
            }
            lButt.onmouseout();
            rButt.onmouseout();
            lButt.up = !(rButt.up = !gview.m_Flip);
            lButt.onclick = rButt.onclick = function(e) {
                e.stopPropagation();
                e.preventDefault();
                if (gview.tmp_gotoFeat) return;
                this.style.background = 'url('+ SeqView.extPath + 'resources/images/default/grid/loading.gif) 0px 0px';
                this.style.width = '11px';
                this.style.backgroundSize = 'cover'; 
                gview.gotoFeature(this.parentNode.idx, (this.up ? 'next' : 'prev') + (e.ctrlKey || e.metaKey ? '_group' : ''),
                    function(){ e.target.onmouseout(); });
            }
        }
        var new_img_el = new Ext.Element(this.m_FromCgi.images[0].img);
        new_img_el.applyStyles("position:absolute; top:0px; left:0px; visibility:hidden;");
        new_img_el.addClass('sv-drag');
        new_img_el.set({id: 'trackRuler', draggable: false});
        new_img_el = the_div.insertFirst(new_img_el);
        new_img_el.move('right', this.m_ScrollPix);
        the_div.setHeight(this.m_Height);
        new_img_el.show();
        var trx = this.m_graphTracks;
        
        for (var tIdx = trx.length - 1; tIdx >= 0; tIdx--) {
            var track = trx[tIdx];
            var tname = 'track_' + ((!track.display_name.length && track.signature == 'Sequence strand') ? (i + 'SqTrk') : i);
            var wrapDiv = this.createTrackDiv(track, screen_width, tname);
            wrapDiv.insertAfter(new_img_el);
            track.div = wrapDiv;
            if (track.area) {
                wrapDiv.dom.tnameDiv = track.area.tname;
                wrapDiv.on('mouseover', function(e){
                    var tnDiv = e.target.parentElement.tnameDiv;
                    if (this.m_tnameDiv && this.m_tnameDiv != tnDiv) this.m_tnameDiv.setStyle('opacity', 0.3);
                    this.m_tnameDiv = tnDiv;
                    tnDiv.setStyle('opacity', 1);
                }, this);
            }
            if (track.legends) the_div.appendChild(this.createLegendsDiv(track, trackConfig));
        }

        if (this.m_FromCgi.areas && this.m_FromCgi.areas.length > 0) {
            this.m_App.addCustomFeatureFlags({view: this, areas: this.m_FromCgi.areas, callback: this.highlightFlaggedFeatures});
        }

        if (this.m_featMarkers)
            the_div.appendChild(this.drawFeatMarkers());
        the_div.unmask();
        this.m_View.doLayout();

        var title = this.updateTitle(options);
        var range = this.toSeq();
        this.pushToHistory(title, range[0], range[2], this.getFlip());

        this.updateStickyToolTip();

        this.updateSelectedRangeToolTip(this);
        this.updateMarkerToolTip(this);
        this.m_App.updateMarkersPos(this);
        this.m_App.updateReflections();

        if (this.m_SelectedRangeSet) this.selectRangeSet(this.m_SelectedRangeSet);
        
        this.blinkAreas(options);

        if (!this.m_App.m_DialogShown) this.m_App.resizeIFrame();

    },
    
    createLegendsDiv: function(track, trackConfig) {
        var legEl = new Ext.Element(document.createElement('div'));
        var bLen = 30;
        var qview_width = this.getScreenWidth();
        var leftOffset = (this.m_Width - qview_width) >> 1;
        var view = this;
        var img = track.image,
            minT = this.m_Height,
            maxB = 0;
        Ext.each(track.legends, function(lg) {
            lg.opacity = parseInt(lg.opacity);
            Ext.each(img.areas, function() {
                if (!((this.type & SeqView.AreaFlags.Legend) 
                    && lg.id == this.id && this.parent_id == trackConfig[track.idx].id)) return true;
                lg.bounds = this.bounds;
                minT = Math.min(minT, this.bounds.t);
                maxB = Math.max(maxB, this.bounds.b);
            });
        });
        legEl.applyStyles('position: absolute; left: 0px;' //font-family: "Monospace", Courier New, serif; font-size: 12px;'
                        + 'width:' + qview_width +'px; height:' + (maxB - minT) + 'px;'
                        + 'top:' + (minT - 3) + 'px;');
        Ext.each(track.legends, function(lg, idx) {
            if (!lg.bounds) return true;
            var ib = lg.bounds;
            var tmpl = new Ext.Template('<div class="sv-drag" style="left:' + (ib.l - leftOffset) + 'px; top:' + (ib.t - minT)+ 'px;'
                + 'width:' + (ib.r - ib.l) + 'px; height:' + (ib.b - ib.t) +'px; position: absolute; cursor: pointer;">'
                + '<div style="width:' + bLen + 'px; height: 8px; position:relative;'
                + 'background-color:' + lg.color + '; opacity:' + (lg.opacity/100)+ ';"></div>'
                + '<div style="color:blue; font-size: 10px; top: -10px; left:' + (bLen + 5)
                + 'px; width:' + (ib.r - ib.l - bLen - 5) + 'px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; position:relative;">'
                + lg.label + '</div></div>');
            var legTrk = tmpl.append(legEl, {}, true).dom;
            legTrk.onclick = function(e) {
                e.stopPropagation();
                e.preventDefault();
                SeqView.pingClick('4-1', 'Graph_Overlay');
                SeqView.TM.modifyLegendSettings(view, track, idx);
            }
        });
        return legEl.dom;
    },

    createTrackDiv: function(track, width, id) {
        var wrapDiv = new Ext.Element(document.createElement('div'));
        wrapDiv.set({id: id});
        wrapDiv.applyStyles('top: ' + track.divT + 'px; width: ' + width
                          + 'px; height: ' + track.imgH + 'px; position:absolute; overflow: hidden;');
        if (id.search('SqTrk') > 0) {
            var tpl = new Ext.Template('<img ext:qtitle="Hint" ext:qtip="Use Drag\'n\'Drop to re-order the tracks" src='
                + track.image.img_url + '></img>');
            var img = tpl.append(wrapDiv, {}, true);
        } else {
            var img = new Ext.Element(document.createElement('img'));
            img.dom.src = track.image.img_url;
            wrapDiv.appendChild(img.dom);
        }
        img.set({draggable: false});

        img.applyStyles('position:relative; overflow:hidden; visibility:visible; top: ' + (-track.imgT)
                      + 'px; left:' + this.m_ScrollPix + 'px;');
        img.addClass(['sv-drag', 'sv-highlight', 'sv-dblclick']);

        return wrapDiv;
    },

    highlightFlaggedFeatures: function() {
        if (this.m_FromCgi.areas) {
            this.removeFeatMarks();
            Ext.each(this.m_FromCgi.areas, function(a) {
                if( (a.type & SeqView.AreaFlags.Dirty) !== 0) {
                   var sh = new SeqView.SelectionHighlighter(this, a, true);
                   if (!this.m_HighLightedFeature) this.m_HighLightedFeature = [];
                   this.m_HighLightedFeature.push(sh);
                }
            },this);
        }
    },

    shiftData: function(srcIdx, dstIdx) {
        this.m_App.m_actTracks = '';
        var trx = this.m_graphTracks;
        var the_div = Ext.get(this.m_DivId);
        var src = trx[srcIdx], dst = trx[dstIdx];
        var offset = the_div.getY();
        var top, botttom, border;
        top = bottom = border = 0; //offset;
        var shiftU = src.divT - dst.divT;
        if (shiftU > 0) { //moving up
            shiftD = src.imgH;
            top += dst.divT;
            border += src.divT
            bottom += src.divT + src.imgH;
        } else { //moving down
            shiftD = dst.imgH - src.imgH - shiftU;
            shiftU = src.imgH;
            top += src.divT;
            border = top + shiftU;
            bottom += dst.divT + dst.imgH;
        }
        var tmp = trx[0].divT;
        trx.splice(dstIdx + (srcIdx < dstIdx), 0, trx[srcIdx]);
        trx.splice(srcIdx + (srcIdx > dstIdx), 1);
        trx[0].divT = tmp;
        trx[0].div.setY(offset + trx[0].divT);
        for (var i = 1; i < trx.length; i++) {
            var y = trx[i].divT = trx[i - 1].divT + trx[i - 1].imgH;
            if (y < top || y >= bottom) continue;
            trx[i].div.setY(offset + y);

        }
        for (var i = trx.length + 2; i < the_div.dom.childNodes.length; i++) {
            var item = Ext.get(the_div.dom.childNodes[i]);
            var y = item.dom.offsetTop;
            if (y < top || y >= bottom) continue;
            item.setY(offset + y + ((y >= border) ? (-shiftU) : shiftD));
        }

        Ext.each(this.m_FromCgi.areas, function(area){
            if (area.signature && area.signature.length) {
                var y = area.bounds.t;
                if (y < top || y >= bottom) return true;
                y = (y >= border) ? (-shiftU) : shiftD;
                area.bounds.t += y;
                area.bounds.b += y;
            }
        }, this);
    },



//////////////////////////////////////////////////////////////////////////
// updateStickyToolTip:

    updateStickyToolTip: function() {
        if (this.ToolTipsMgr) {
            this.ToolTipsMgr.each(function(tt) {
                tt.areaVisible(false);
                Ext.each(this.m_FromCgi.areas, function(a) {
                    if (a.signature == tt.area.signature) {
                        if (tt.area.qtip) {
                            a.qtip = tt.area.qtip;
                            delete tt.area.qtip;
                        }
                        tt.area = a;
                        tt.areaVisible(true);
                        if (tt.delayedHighlight) {
                            tt.highlightFeat();
                            delete tt.delayedHighlight;
                        }
                        return false;
                    }
                });
            },this);
        }
    },

//////////////////////////////////////////////////////////////////////////

       updateSelectedRangeToolTip: function() {
        if (this.SelectedRangeToolTipsMgr) {
            this.SelectedRangeToolTipsMgr.each(function(tt) {
            },this);
        }
    },
      updateMarkerToolTip: function() {
        if (this.MarkerToolTipsMgr) {
            this.MarkerToolTipsMgr.each(function(tt) {
            },this);
        }
    },
//////////////////////////////////////////////////////////////////////////
// clearCache:

    clearCache: function() {
        this.m_PrevCgi= null; // clear next/prev cache
        this.m_NextCgi = null;
        this.m_UrlFrom = null;
        this.m_UrlTo = null;
    },

//////////////////////////////////////////////////////////////////////////
// scrollElements:

    scrollElements: function(delta) {
        this.m_App.scrollReflections(this, delta);
        this.m_App.scrollMarkers(this, delta);
        if (this.m_featMarkers) {
            this.m_featMarkers.div.style.left = this.m_featMarkers.left + this.m_ScrollPix + 'px';
        }

        if (this.m_HighLightedFeature) {
            Ext.each(this.m_HighLightedFeature,function(sf) {
                sf.movePix(delta);
            });
        }
        if (this.m_Selection) { this.m_Selection.movePix(delta); }
        var sel_set = this.m_RangeSelectionSet;
        if (sel_set && sel_set.length) {
            var l = sel_set.length;
            for (var x = 0; x < l; ++x)
                sel_set[x].movePix(delta);
        }
    },

    updateImagePosition: function(new_pos){
        var delta = this.m_ScrollPix - new_pos;
        if (delta == 0) return false;

        // Invalidate cached exact sequence coordinates
        // We can't delete m_ReqFrom because when moving
        // image fast we can reach here sooner than applyResultsOnLoad
        // which uses m_ReqFrom.
        delete this.m_ReqLen;

        this.m_ScrollPix = new_pos;

        this.scrollElements(delta);

        if (!this.m_LoadingImageShown) {
            var the_div = Ext.get(this.m_DivId);
            var img_el = the_div.first('img');
            var npos = this.m_ScrollPix + the_div.getX();
            if (img_el){
                img_el.setX(npos);
                Ext.each(the_div.dom.children, function () {
                    if (this.id.search('track_') == 0)
                        Ext.get(this.children[0]).setX(npos);
                });
            }
        }

        return true;
    },

//////////////////////////////////////////////////////////////////////////
// scrollView:

    scrollViewTo: function(new_pos, dir, drag, options){
// returns TRUE if a new image was requested to load 
        drag = drag || false;

        this.m_UrlFrom = null;
        this.m_UrlTo = null;

        var screen_width = this.getScreenWidth();

        new_pos = Math.min(0, new_pos);
        new_pos = Math.max(new_pos, screen_width-this.m_Width);

        if (!this.updateImagePosition(new_pos)) return false;

        var vis_title = this.updateTitle({from_ui: true, transitional: drag }); // and save visible range
        var vis_range = this.toSeq();
        var preloadMargin = Math.min(SeqView.ChunkWidth, this.m_Width/10);

        if (!this.m_Loading
            && ((new_pos < screen_width - this.m_Width + preloadMargin &&  dir == SeqView.PAN_RIGHT)
                || (new_pos > -preloadMargin && !this.m_Loading && dir == SeqView.PAN_LEFT)))
        {
            var new_from, new_len;
            var bpp = Math.max(SeqView.MinBpp, this.m_bpPix);

            var loading_needed = true;
            if (dir == SeqView.PAN_RIGHT) { // moving right
                if (this.getFlip() && this.m_FromSeq == 0) { loading_needed = false; } // start of sequence reached - no loading
                if (vis_range[1] >= Math.floor(this.m_App.m_SeqLength - preloadMargin * bpp)) { loading_needed = false; }// end of sequence reached - no loading (to >= seq_len minus preload margin)
            } else if (dir == SeqView.PAN_LEFT) { // moving left
                if (!this.getFlip() && this.m_FromSeq == 0) { loading_needed = false; }// start of sequence reached - no loading
                if (this.getFlip() && vis_range[1] >= Math.floor(this.m_App.m_SeqLength - preloadMargin * bpp)) { loading_needed = false; } // end of sequence reached - no loading (to >= seq_len minus preload margin)
            }
            if (loading_needed) {
                new_from = vis_range[0];// + vis_range[2] / 2;
                new_len = vis_range[2];
                this.m_Loading = true;
                this.m_ScrollPixBeforeLoad = this.m_ScrollPix; // save scroll offset at the time of load request
                var opt = options || {};
                opt.from_ui = opt.transitional = true;
                this.loadImage(new_from, new_len, opt);
                return true;
            }
        }
        this.pushToHistory(vis_title, vis_range[0], vis_range[2], this.getFlip());
        return false;
    },

//////////////////////////////////////////////////////////////////////////
// updateTitle:

    updateTitle: function( options ){
        var range = this.toSeq();
        var r_range_from = range[0] + 1;
        var r_range_to   = range[1] + 1;

        if (this.getFlip()) {
            var t = r_range_from;
            r_range_from = r_range_to;
            r_range_to = t;
        }

        var units = (this.m_App.m_ViewParams['acc_type']=='protein' ? 'residues' : 'bases')

        var title = '';
        var main_title = this.m_App.m_ViewParams['id'] + '&nbsp;(' + this.m_App.m_SeqLength.shorten() + '&nbsp;' + units;

        if (this.m_App.m_Origin != 0) {
            var origin_ext = this.m_App.m_Origin + 1;
            main_title += ',&nbsp;sequence origin:&nbsp;' + origin_ext.commify();
        }
        main_title += ')';
        this.m_App.m_Panel.setTitle(main_title);

        title += this.m_App.m_ViewParams['id'] + ':&nbsp;';
        title += r_range_from.shorten() + '..' + r_range_to.shorten();
        title += '&nbsp;(' + (range[1] - range[0] + 1).shorten();
        title += (this.m_App.m_ViewParams['acc_type']=='protein' ? 'r' : 'bp');
        title += ')';

        if( this.canFlip() ){
            if (this.getFlip()) { title += ' C'; }
            //else { title += '+'; }
        }

        this.m_View.setTitle( '<b>' + title + '</b>' );

        var tbar = this.m_View.getTopToolbar();
        if( tbar ){
            var tbtitle = tbar.getComponent( 'tbtitle'+this.m_Idx );
            if( tbtitle ){
                var tiptitle = '<b>';
                tiptitle += this.m_App.m_ViewParams['id'];
                tiptitle += ': ' + this.m_App.m_Config.SeqInfo.title;
                tiptitle += '</b><br/><br/>';

                tiptitle += r_range_from.commify() + '&nbsp;-&nbsp;' + r_range_to.commify();

                //tiptitle += '&nbsp;(';
                tiptitle += '<br/>';
                tiptitle += (range[1] - range[0] + 1).commify() + '&nbsp;';
                tiptitle += (this.m_App.m_ViewParams['acc_type']=='protein' ? 'residues' : 'bases');
                tiptitle += '&nbsp;shown';

                if( this.canFlip() ){
                    if( this.getFlip() ){
                        tiptitle += ',&nbsp;reverse complement';
                    } else {
                        tiptitle += ',&nbsp;positive strand';
                    }
                }
                //tiptitle += ")";

                tbtitle.setTooltip( tiptitle );

                if( this.getScreenWidth() < 650 ){
                    tbtitle.setWidth( undefined );
                    tbtitle.setText( '' );
                    tbtitle.setIconClass( 'xsv-seq-logo' );

                } else {
                    tbtitle.setWidth( 200 );
                    tbtitle.setText( '<b>' + title + '</b>' );
                    tbtitle.setIconClass( '' );
                }
            }

            //taking care of showing either "Find on Sequence" button with text field or just button
            var searchButton = tbar.getComponent('sv-search-btn_'+this.m_Idx);
            if (searchButton) searchButton.hide();
            var tbgts = tbar.getComponent('sv-goto-box_'+this.m_Idx);
            var tbgtsb = tbar.getComponent('sv-goto-btn_'+this.m_Idx);
            if (tbgts && tbgtsb) {
                tbgts.show();
                tbgtsb.show();
            } else {
                if (searchButton) searchButton.show();
            }
            var tbtoolsb = tbar.getComponent('sv-tools-btn_'+this.m_Idx);
            if (tbtoolsb) tbtoolsb.setText('Tools');
            var tools = tbar.items.items;
            if ((tbgts && tbgtsb) && tbar.el.getRight() < tools[tools.length - 1].el.getRight()) {
                tbgts.hide();
                tbgtsb.hide();
                if (searchButton) searchButton.show();
            }
            if (tbtoolsb && tbar.el.getRight() < tools[tools.length - 1].el.getRight()) {
                tbtoolsb.setText(''); // Tools menu
            }
        }

        var rv_title = '';
        rv_title += r_range_from.commify() + '&nbsp;-&nbsp;' + r_range_to.commify();

        rv_title += '&nbsp;('+ (range[1] - range[0] + 1).commify() + '&nbsp;';
        rv_title += (this.m_App.m_ViewParams['acc_type']=='protein' ? 'residues' : 'bases');
        //rv_title += '&nbsp;shown';

        if( this.canFlip() ){
            if( this.getFlip() ){
                rv_title += ',&nbsp;negative';
            } else {
                rv_title += ',&nbsp;positive';
            }
        }
        rv_title += ")";

        this.m_VisFromSeq = range[0];
        this.m_VisLenSeq = range[2];

        var href = Ext.get('new_view_link'+this.m_App.m_Idx);
        if (href) {
            href.on({ 'click' : this.openFullView,  scope:this });
        }
        if (!options || options.update_locator !== false) {
            this.m_App.updateLocator(this);
        }

        if( true /*options && options.fire !== false */ ){
            //(this.m_VisFromSeq != range[0] && this.m_VisLenSeq != range[2]);
            if( options && options.from_ui ){
                this.m_App.fireEvent( 'ui_visible_range_changed', this );
            } else {
                this.m_App.fireEvent( 'api_visible_range_changed', this );
            }

            var flags = {};
            flags.from_ui = options && options.from_ui;
            flags.transitional = options && options.transitional;
            flags.fire = options && options.fire;

            //TRANSitional
            this.m_App.fireEvent( 'visible_range_changed', this, flags );
        }

        return rv_title;
    },

    pushToHistory: function( title, from, length, flip ){

        if( this.m_InDragAction ) return;

        if( this.m_HistIx < 0 ){
            this.m_HistIx = 0;
        }

        var current = { title: title, from: from, len: length, flip: flip };

        if( this.m_HistIx < this.m_History.length ){
            if(
                this.mf_HistoricalBack
                || (
                    Math.abs( current.from - this.m_History[this.m_HistIx].from ) <= 1
                    && current.len == this.m_History[this.m_HistIx].len
                    && current.flip == this.m_History[this.m_HistIx].flip
                )
            ){
                this.mf_HistoricalBack = false;
                return;
            }

            if( this.m_HistIx > 0 ){
                this.m_History = this.m_History.slice( this.m_HistIx );
                this.m_HistIx = 0;
            }

            this.m_History.unshift( current );

        } else {
            this.m_History.push( current );
            this.m_HistIx = this.m_History.length -1;
        }
        this.mf_HistoricalBack = false;

        var MAX_HISTORY_LENGTH = 10;
        var mhl = MAX_HISTORY_LENGTH;

        if( this.m_History.length > mhl ){
            if( this.m_HistIx < mhl ){
                this.m_History = this.m_History.slice( 0, mhl );
            } else {
                this.m_History = this.m_History.slice( this.m_HistIx -mhl +1, mhl );
                this.m_HistIx = this.m_History.length -1;
            }
        }

        this.updateHistoryButtons();
    },

    stepHistory: function( forward, options ){

        if( forward ){
            if( this.m_HistIx > 0 ){
                this.m_HistIx--;
                this.mf_HistoricalBack = true;
                this.setFlip( this.m_History[this.m_HistIx].flip );
                this.startImageLoading( this.m_History[this.m_HistIx].from, this.m_History[this.m_HistIx].len, options );
            }
        } else {
            if( this.m_HistIx < this.m_History.length-1 ){
                this.m_HistIx++;
                this.mf_HistoricalBack = true;
                this.setFlip( this.m_History[this.m_HistIx].flip );
                this.startImageLoading( this.m_History[this.m_HistIx].from, this.m_History[this.m_HistIx].len, options );
            }
        }

        this.updateHistoryButtons();
    },

    updateHistoryButtons: function() {
        var tbar = this.m_View.getTopToolbar();
        if (tbar) {
            var btn_prev = tbar.getComponent('histPrev'+this.m_Idx);
            if (btn_prev) {
                var tooltip = '';
                if (this.m_HistIx >= this.m_History.length-1) {
                    btn_prev.disable();
                    tooltip = 'Back';
                } else {
                    btn_prev.enable();
                    if (this.m_HistIx+1 < this.m_History.length) {
                        tooltip += 'Back to ' + this.m_History[this.m_HistIx+1].title;
                    }
                }
                btn_prev.setTooltip( tooltip );
            }
            var btn_next = tbar.getComponent('histNext');
            if (btn_next) {
                var tooltip = '';
                if (this.m_HistIx <= 0) {
                    btn_next.disable();
                    tooltip = 'Forward';
                } else {
                    btn_next.enable();
                    for (var j = this.m_HistIx-1; j >= 0; j--){
                        tooltip += this.m_History[j].title + '<br/>';
                    }
                }
                btn_next.setTooltip(tooltip);
            }
        }
    },

    moveTo: function( vis_from, vis_len, opts ){
        if (vis_len == this.m_VisLenSeq) {
            var cur_vis_from_pix = Math.round(this.seq2Pix(this.m_VisFromSeq));
            var new_vis_from_pix = Math.round(this.seq2Pix(vis_from));
            var delta_x = cur_vis_from_pix - new_vis_from_pix;
            if (delta_x == 0)
                return;

            var cur_x = Math.round(this.m_ScrollPix);
            cur_x = cur_x + delta_x;
            var rest_len = this.m_Width + this.m_ScrollPix - this.getScreenWidth();
            if ( cur_x > 0 || (delta_x < 0 && -delta_x > rest_len) ){
                this.m_ZoomOP = 'locator';
                this.startImageLoading( vis_from, vis_len, opts );
            } else {
                // No need to check as it is done above
                this.updateImagePosition(cur_x);
                this.updateTitle(opts);
            }
        } else {
            this.m_ZoomOP = 'locator';
            this.startImageLoading( vis_from, vis_len, opts );
        }
    },

    syncToLocator: function() {

        if( !this.m_Locator ) return;

        var vis_from = this.m_App.m_Panorama.toSeq( this.m_Locator.getLeft( true ) );
        var vis_to;

        if( this.m_Locator.m_Action == 'Drag' ){
            vis_to = vis_from + this.m_VisLenSeq -1; // keep length

        } else {
            vis_to = this.m_App.m_Panorama.toSeq( this.m_Locator.getLeft(true) + this.m_Locator.getWidth() +3 );
        }

        var len = vis_to - vis_from +1;

        this.moveTo( vis_from, len, { update_locator: false, from_ui: true } );
    },


    checkLocatorWidth: function(width) {
        var len = this.m_App.m_Panorama.toSeq(width+3);
        return SeqView.MinBpp < len/this.getScreenWidth();
    },


    hitTest: function(page_xy) {
        if (this.m_Loading || this.m_InDragAction)
            return null;

        var the_area = null;
        var elem_xy = Ext.get(this.m_DivId).getXY();
        var xx = page_xy[0] - elem_xy[0];
        var slim = this.m_slimMode;
        var scrollPix = this.m_ScrollPix;
        var yy = page_xy[1] - elem_xy[1] + 3;// - config['top_offset'];
        var checkArea = function(area) {
            var bounds = area.bounds;
            var x = xx - ((slim && (area.type & (SeqView.AreaFlags.Track | SeqView.AreaFlags.Sequence)) > 0) ? 0 : scrollPix);
            var left  = this.getFlip() ? bounds.r : bounds.l;
            var right = this.getFlip() ? bounds.l : bounds.r;

            if (x >= left-1 && x <= right+1 && yy >= bounds.t && yy < bounds.b) {
                if (!the_area) the_area = [];
                the_area.push(area);

            }
        }
        Ext.each(this.m_FromCgi.areas, checkArea.createInterceptor(function(area){
            var sig = area.signature;
            if (!sig || sig.length==0)
                return false;
        },this),this);

        return the_area;
    },

    highlightElement: function(page_xy) {
        var areas = this.hitTest(page_xy);
//console.log(page_xy[1], (areas ? areas[0].bounds : ''));
        if (this.m_slimMode && areas && (areas[0].type  & (SeqView.AreaFlags.Track | SeqView.AreaFlags.Sequence))) {
            areas.shift();
            if (!areas.length) return;
            if (this.m_Selection && areas[0].signature != this.m_Selection.areas[0].signature)
                this.removeFloatingSelection();
        }
        if (areas && !this.m_Selection) {
            this.m_Selection = new SeqView.Selection(this, areas);
        } else {
            if (!this.m_Selection || !areas || areas[0].signature != this.m_Selection.areas[0].signature)
                this.removeFloatingSelection();
        }
    },

    onMouseDown: function(e) {
        if (this.m_ContextMenu) this.m_ContextMenu.destroy();
        if ((e.type == 'mousedown' && e.button) || this.m_Loading) return;
        this.m_XY = e.getXY();
        var div_xy;
        var div = Ext.fly(e.getTarget()).findParent('div.graphical_div', 10, true);
        if (div) {
            div_xy = div.getXY();
        }
        if ((div_xy  &&  this.m_XY[1] - div_xy[1] < 19)) {
            // Add range selection
            e.stopEvent();
            if (!e.ctrlKey) {
                this.removeSelectionsWithNoPinnedToolTips();
            }
            this.m_InDragAction = true;
            new SeqView.RangeSelection(this, [this.m_XY[0]], e);
            this.m_XY = null;
            return;
        }
        if (e.type != 'mousedown')
            this.m_deferredContext = this.showContextMenu.defer(2000, this, [this.m_XY]);

        if (Ext.fly(e.getTarget()).hasClass('sv-drag')) {
            this.m_InDragAction = true;
            e.stopEvent();
            Ext.fly(this.m_DivId).setStyle('cursor', 'move');
            Ext.fly(e.getTarget()).setStyle('cursor', 'move');

            this.m_targetTrackId = e.getTarget().id;
            var view = this;
            var onMove = function(e) {view.onMouseMove(Ext.EventObject.setEvent(e ? e : window.event));}
            var onEnd = function(e) {view.onMouseUp(Ext.EventObject.setEvent(e ? e : window.event));}
            if (e.button == 0) {
                this.m_DocMouseMove = document.onmousemove;
                this.m_DocMouseUp = document.onmouseup;
                document.onmousemove = onMove;
                document.onmouseup = onEnd;
            } else {
                this.m_DocTouchMove = document.ontouchmove;
                this.m_DocTouchUp = document.ontouchend;
                document.ontouchmove = onMove;
                document.ontouchend = onEnd;
            }
        }

    },

    onMouseUp: function(e) {
        this.m_InDragAction = false;
        if (!this.m_XY) { return; }
        if (this.m_deferredContext)
        {
            clearTimeout(this.m_deferredContext);
            this.m_deferredContext = 0;
        }
        Ext.fly(this.m_DivId).setStyle('cursor', 'default');
        try {
            Ext.fly(this.m_targetTrackId).setStyle('cursor', 'default');
        } catch(e){}

        if (this.m_targetTrackClone) {
            Ext.removeNode(this.m_targetTrackClone.dom);
            var app = this.m_App;
            delete this.m_targetTrackClone;
            delete this.m_targetTrackId;
            delete app.m_currentTrackSetId;
            var tracks_for_save = SeqView.TM.tracksArrayToString(app.m_Config.TrackConfig, true, true);
            app.m_Config.save({tracks: tracks_for_save, callback : {success: function(){
                app.fireEvent('configuration_changed', app);
            }}});
            SeqView.pingClick('2-0-0');
            if (this.m_SelectedSig) {
                this.refresh();
            }
        }
        if (this.m_scrolled) {
            delete this.m_scrolled;
            clearTimeout(SeqView.scrolled);
            SeqView.scrolled = setTimeout(function() { delete SeqView.scrolled; }, 500);
        }
        this.m_XY = null;
        if (e.button == 0) {
            document.onmousemove = this.m_DocMouseMove;
            document.onmouseup = this.m_DocMouseUp;
        } else {
            document.ontouchmove = this.m_DocTouchMove;
            document.ontouchend = this.m_DocTouchUp;
        }
        this.m_DocMouseMove = this.m_DocMouseUp = this.m_DocTouchMove = this.m_DocTouchUp = null;

        var title = this.updateTitle( {from_ui: true, transitional: false, fire: false } );
        var range = this.toSeq();
        this.pushToHistory( title, range[0], range[2], this.getFlip() );
    },

    onMouseMove: function(e) {
        SeqView.ClearBrowserSelection();
        if (this.m_InDragAction) {
            if (!this.m_XY) { return; }
            if (e.button > 0) {
                this.onMouseUp(e)
                return;
            }

            var sensivity = 2;
            var xy = e.getXY();
            var delta_x = this.m_XY[0] - xy[0];
            var delta_y = this.m_XY[1] - xy[1];
            // ignore vertical moving if there is a permanent ControlPanel
            // or it's a trackRuler (when overal tracks height is less then img height)
            if (this.m_App.m_PermConfId || e.getTarget().id == 'trackRuller') delta_y = 0;
            if (delta_x == 0 && delta_y == 0) return;
            var XminusY = Math.abs(delta_x) - Math.abs(delta_y);
            if (Math.abs(XminusY) <= sensivity) return;
            if (this.m_deferredContext) {
                clearTimeout(this.m_deferredContext);
                this.m_deferredContext = 0;
            }

            if (XminusY > 0 ) {
                var cur_x = this.m_ScrollPix;
                cur_x = cur_x - delta_x;
                this.m_XY = xy; // save new values
                this.scrollViewTo(cur_x, delta_x > 0 ? SeqView.PAN_RIGHT : SeqView.PAN_LEFT, true);
                this.m_scrolled = true;
            } else { // tracks moving processing
                var tracks = this.m_graphTracks;
                var the_div = Ext.get(this.m_DivId);
                var src = -1, dst;
                var pY = this.m_XY[1] - the_div.getY();

                for (var i = 0; i < tracks.length; i++) {
                    if (pY > tracks[i].divT && pY < tracks[i].divT + tracks[i].imgH) {
                        src = i;
                        break;
                    }
                }

                if (src >= 0) {
                    var srcY = tracks[src].divT - delta_y;
                    if (delta_y > 0) {// moving up
                        for (dst = 0; dst < src; dst++) {
                            pY = tracks[dst].divT - srcY;
                            if (Math.abs(pY) <= sensivity) break;
                        }
                    } else {// moving down
                        srcY = tracks[src].divT+ tracks[src].imgH - delta_y;
                        for (dst = tracks.length - 1; dst > src; dst--) {
                            pY = tracks[dst].divT+ tracks[dst].imgH - srcY
                            if (Math.abs(pY) <= sensivity) break;
                        }
                    }
                    if (!this.m_targetTrackClone) {
                        this.m_targetTrackClone = this.createTrackDiv(tracks[src], this.getScreenWidth(), 'track_clone');
                        this.m_targetTrackClone.dom.style.outline = 'green solid 1px';
                        this.m_targetTrackClone.insertAfter(the_div.dom.childNodes[tracks.length]);
                    }
                    if (dst != src) {
                        this.shiftData(src, dst);
                        this.m_targetTrackClone.setY(tracks[dst].div.getY() - pY);
                        this.m_XY = xy;
                        // tracks shifting in TrackConfig
                        for (var i = 0; i < tracks.length; i++) {
                            this.m_App.m_Config.TrackConfig[tracks[i].idx].order = i;
                        }
                    } else {
                        this.m_targetTrackClone.setY(tracks[src].div.getY() - delta_y);
                    }
                }
            }
            e.stopEvent();

        } else {
            if (Ext.fly(e.getTarget()).hasClass('sv-highlight')) { // GView
                this.highlightElement(e.getXY());
            }

        }
    },


    onContextMenu: function(e) {
        e.stopEvent();
        this.showContextMenu(e.getXY());
    },

    // callback allows to customize the menu if you clicked on an object
    showContextMenu: function(xy, callback) {
        if (this.m_Loading) return;
        if (this.m_deferredContext) {
            clearTimeout(this.m_deferredContext);
            this.m_deferredContext = 0;
        }
        var menu = new Ext.menu.Menu();
        var x_pos = xy[0] - Ext.get(this.m_DivId).getX();
        var seq_pos = this.pix2Seq(x_pos - this.m_ScrollPix);
        menu.add(
            {text:'Set New Marker At Position', iconCls:'xsv-markers', scope:this,
             handler:function() {SeqView.pingClick('2-1-0'); this.m_App.newMarkerDlg(this, x_pos); }
        });
        if (this.m_SelectedRangeSet  &&  this.m_SelectedRangeSet.length === 1) {
            menu.add(
                {text:'Set New Marker For Selection',iconCls:'xsv-markers', scope:this,
                 handler:function() {
                    SeqView.pingClick('2-1-1');
                    this.m_App.addMarker(this.m_SelectedRangeSet[0]);
                    this.removeRangeSelection(true);
                }
            });
        }
        menu.add('-');
        if (this.m_App.m_Origin) {
            menu.add({text:'Reset Sequence Origin', iconCls:'xsv-origin', scope:this,
                handler:function() {this.m_App.clearOrigin(); SeqView.pingClick('2-1-2');}});
        } else {
            menu.add({text:'Set Sequence Origin At Position', iconCls:'xsv-origin', scope:this,
                handler:function() { this.m_App.setOrigin(this, x_pos); SeqView.pingClick('2-1-2');}});
        }

        if( this.canFlip() ){
            menu.add({
                text:'Flip Sequence Strands', iconCls:'xsv-flip-strands', scope: this,
                enableToggle: true, pressed: this.getFlip(),
                handler:function() { this.flipStrand(); }
            });
        }

        menu.add({iconCls:'xsv-zoom_plus', text:'Zoom In', scope: this,
            handler:function() {this.zoomIn(seq_pos); SeqView.pingClick('2-1-3');}});
        menu.add({iconCls:'xsv-zoom_minus', text:'Zoom Out', scope: this,
            handler:function() {this.zoomOut(seq_pos); SeqView.pingClick('2-1-4');}});
        menu.add({iconCls:'xsv-zoom_seq', text:'Zoom To Sequence', scope: this,
            handler:function() {this.zoomSeq(seq_pos); SeqView.pingClick('2-1-5');}});
        menu.add({iconCls:'xsv-zoom_range', text:'Zoom On Range', scope: this,
            handler:function() {this.zoomRange(); SeqView.pingClick('2-1-6');}});
        if (this.m_App.mf_MultiPanel)
            menu.add({iconCls:'xsv-new_view', text:'Add New Panel on Range', tooltip:'Create New Graphical Panel on Selected Range',
                scope:this, handler:function() {
                    var view = new SeqView.Graphic(this.m_App);
                    this.m_App.registerView(view);

                    var from = -1, to = -1;
                    var range = this.getTotalSelectedRange();
                    if( range[0] !== -1 && range[1] !== -1 ){
                        from = range[0];
                        to   = range[1];
                        this.removeRangeSelection(true);

                    } else if( this.m_UrlFrom ){
                        from = this.m_UrlFrom;
                        to   = this.m_UrlTo;
                    } else {
                        from = this.m_VisFromSeq + 1;
                        to   = this.m_VisFromSeq + this.m_VisLenSeq;
                    }

                    if( from !== -1 && to !== -1 ){
                        view.startImageLoading( from, to - from + 1, {from_ui: true} );
                    }
                    SeqView.pingClick('2-1-7');
                }
        });

        menu.add('-');
        // Tools - Blast and Primer Blast
        var noPBlast = (this.m_App.m_ViewParams['acc_type'] !== 'DNA');
        var tools_submenu = new Ext.menu.Menu();
        if (this.m_SelectedRangeSet  &&  this.m_SelectedRangeSet.length > 0  &&  this.m_SelectedRangeSet.length <= 2) {
            tools_submenu.add({iconCls:'xsv-blast', text:'BLAST Search (Selection)', scope: this,
                handler:function() { this.blastSelection(); SeqView.pingClick('2-1-8-1');} });
            tools_submenu.add({iconCls:'xsv-primer', text:'Primer BLAST (Selection)', scope: this, disabled: noPBlast,
                handler:function() { this.primerBlast(); SeqView.pingClick('2-1-8-2');} });
        }
        tools_submenu.add({text:'BLAST Search (Visible Range)', iconCls:'xsv-blast', scope: this, handler:function() {
                              this.m_App.blast([this.m_VisFromSeq, this.m_VisFromSeq + this.m_VisLenSeq - 1]);
                              SeqView.pingClick('2-1-8-3');
                        } });
        tools_submenu.add({text:'Primer BLAST (Visible Range)', iconCls:'xsv-primer', scope: this, disabled: noPBlast, handler:function() {
                              this.primerBlast(false, [ [this.m_VisFromSeq, this.m_VisFromSeq + this.m_VisLenSeq - 1] ]);
                              SeqView.pingClick('2-1-8-4');
                        } });
        menu.add({text:'BLAST and Primer Search', tooltip:'Tools', iconCls:'xsv-views_tools', menu:tools_submenu});
        //

        //adding download menu
        var download_submenu = new Ext.menu.Menu();
        download_submenu.add({text:'FASTA (Visible Range)', scope:this,
            handler:function() {this.downloadData(false, "fasta", null); SeqView.pingClick('2-1-9-1');}
        });
        if (this.m_RangeSelectionSet.length > 0) {
            download_submenu.add({text:'FASTA (All Selections)', scope:this,
                handler:function() {this.downloadData(true, "fasta", null); SeqView.pingClick('2-1-9-2');}
            });
        }
        download_submenu.add({text:'GenBank Flat File (Visible Range)', scope:this,
            handler:function() {this.downloadData(false, "flat", null); SeqView.pingClick('2-1-9-3');}
        });
        if (this.m_RangeSelectionSet.length > 0) {
            download_submenu.add({text:'GenBank Flat File (All Selections)', scope:this,
                handler:function() {this.downloadData(true, "flat", null); SeqView.pingClick('2-1-9-4');}
            });
        }

        download_submenu.add(
            {text:'PDF file (Visible Range)', disabled: this.m_App.m_NoPDF, scope: this,
             handler:function() {SeqView.pingClick('2-1-9-5'); this.downloadPDF();}}
        );


        menu.add('-', {text:'Download', iconCls:'xsv-download-static', menu:download_submenu});

        if (this.m_App.m_NoConfDlg !== true && !this.m_App.m_PermConfId) {
            menu.add('-', {iconCls: 'xsv-config', text: 'Configure tracks',
                hidden: this.m_App.countActiveSeqPanels() != 1,
                scope: this, handler:function() {
                    SeqView.pingClick('2-1-9-6');
                    this.m_App.showTracksConfigDlg(0);
                }
            });
        }

        if (callback) callback(menu, download_submenu);

        if( menu.items.length > 0 ){
            menu.showAt(xy);
            this.m_ContextMenu = menu;
        }
    },

//////////////////////////////////////////////////////////////////////////
// downloadData:

    downloadData: function(isRangeSelected, format, range) {
        if (isRangeSelected && this.m_RangeSelectionSet.length == 0) {
            Ext.Msg.show({
                title:'Download',
                msg: 'Error: no selection is found',
                buttons: Ext.Msg.OK,
                icon: Ext.Msg.ERROR
           });
           return;
        }
        var ranges = "";
        var first = this.m_App.m_Config.SeqInfo.length, last = 0;
        var flip = this.m_App.m_Flip;
        var strand = flip ? "(-)" : "";

        if (range && range.length > 0) {
            if (!flip) 
                ranges = range[0] + "-" + range[1];
            else
                ranges = range[1] + "-" + range[0];
            first = range[0];
            last = range[1];
        }
        else if (!range && isRangeSelected) {
            for (x = 0; x < this.m_RangeSelectionSet.length; x++) {
                range = this.m_RangeSelectionSet[x].range;
                if (x > 0 ) ranges += ",";
                if (!flip) 
                    ranges += range[0] + "-" + range[1];
                else
                    ranges += range[1] + "-" + range[0];
                last = Math.max(range[1], last);
                first = Math.min(range[0], first);
            }
        } else {
            last = this.m_VisFromSeq + this.m_VisLenSeq - 1;
            first = this.m_VisFromSeq;
            if (!flip) 
                ranges = first + "-" + last;
            else
                ranges = last + "-" + first;
        }
        var url = this.m_App.m_CGIs.SequenceSave + '?id='+ this.m_App.GI + '&format=' + format+ '&ranges='+ ranges
            + '&filename=' + this.m_App.m_Config.SeqInfo.id + '[' + (++first) + '..' + (++last) + ']' + strand + '.' + (format != 'flat' ? 'fa' : format);
        if (this.m_App.m_Key) {
            url += '&key=' + this.m_App.m_Key;
        }
        // Creating form for submitting request to allow browser to handle
        // Content-Disposition header
        if (ranges.length> 0) {
            var form = Ext.DomHelper.append(document.body, {
               tag : 'form',
               method : 'post',
               action : url
           });
           document.body.appendChild(form);
           form.submit();
           document.body.removeChild(form);
        }
    },

    downloadPDF: function() {
        var saveButt = 'Save';
        var buttHandler = function(butt, event){
            if (butt.text != saveButt) {
                window.open(this.formPDF.pdf_url + '&inline=true');
                return;
            };
            var form = Ext.DomHelper.append(document.body,
                 { tag: 'form', method: 'post', action: this.formPDF.pdf_url});
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        };
        var win = new Ext.Window({
            title: 'Download PDF-file',
            modal: true,
            layout:'fit',
            minWidth:360,
            width:360,
            height:300,
            plain: true,
            cls: 'SeqViewerApp'
        });
        var adjustedRange1=this.m_App.posToLocalDisplay(this.m_VisFromSeq);
        var adjustedRange2=this.m_App.posToLocalDisplay(this.m_VisLenSeq + this.m_VisFromSeq - 1);

        var formPDF = new Ext.FormPanel({
            labelWidth: 1, // label settings here cascade unless overridden
            frame:true,
            bodyStyle:'padding:5px 5px 0',
            pdf_url: '',
            items: [{
                xtype:'fieldset',
                title: 'Enter Sequence Range',
                autoHeight: true,
                defaultType: 'textfield',

                items :[
                    { xtype: 'label', html: 'Possible range formats are '
                        + '10k-20k, -20--10, -10k:-5, 5 to 515, -1m..1m<br/><br/>' },
                    { id: 'sv-pdf_range', width: 290, value: adjustedRange1 + ':' + adjustedRange2,
                        tooltip: 'Range formats are 10k-20k, -20--10, -10k:-5, 5 to 515, -1m..1m'
                    },
                    {
                        xtype: 'button', text: 'Create PDF-file',
                        tooltip: 'Range formats are 10k-20k, -20--10, -10k:-5, 5 to 515, -1m..1m',
                        width: 300, scope: this, handler:
                            function() {
                                this.m_App.showMessage('', true);
                                this.m_App.showMessage('');
                                this.m_App.m_PDFcomp = Ext.getCmp('sv-PDFcompatibility').checked;
                                this.m_App.m_PDFtitle = Ext.getCmp('sv-PDFtitle').checked;
                                this.m_App.handlePos(Ext.getCmp('sv-pdf_range').getValue(),
                                                     { allow_equal: false, ask_user: true, scope: this,
                                                       success: this.createPDF,
                                                       failure: function(error, options){
                                                           this.m_App.showMessage(error, true);
                                                       }})
                            }
                    }
                ]
            },
            {
            xtype:'checkbox', id: 'sv-PDFtitle', checked: (this.m_App.m_PDFtitle) ? this.m_App.m_PDFtitle : false, boxLabel: 'Add title bar'
            },
            {
            xtype:'checkbox', id: 'sv-PDFcompatibility', checked: (this.m_App.m_PDFcomp) ? this.m_App.m_PDFcomp : true,
                boxLabel: 'Simplified color shading'},{
            xtype:'displayfield', id: 'sv-uplerr' + this.m_App.m_DivId, value: '', hidden: true,
                style: {color:'red', "text-align": 'left', "margin-top":'10px', "margin-left":'6px'}},{
            xtype: 'displayfield', id: 'sv-uplmsg' + this.m_App.m_DivId, value: 'Applying simplified color shading provides wider compatibility with 3rd party PDF-editors',
                style: {color:'grey', "text-align": 'left', "margin-top":'10px', "margin-left":'6px'}}
            ],

            buttons: [{
                text: 'View', scope: this, disabled: true, handler: buttHandler },{
                text: saveButt, scope: this, disabled: true, handler: buttHandler },{
                text: 'Cancel', scope: this, handler: function(){ win.close(); delete this.formPDF; }
            }]
        });
        win.add(formPDF);
        this.formPDF = formPDF;
        win.show();
    },

    setPreferences: function() {
        var app = this.m_App;
        var optWindow = new Ext.Window({
            title: 'Preferences',
            layout: 'fit',
            modal: true,
            height: 180,
            width: 320,
            cls: 'SeqViewerApp'
        });

        var fields = [['color','Coloration'], [ 'label','Label Placement'], ['decor','Shapes'], ['spacing','Spacing']];
        var options = app.m_Config.Options
        var items = [];
        Ext.each(fields, function(p) {
            items.push({
                xtype: 'combo', triggerAction: 'all', fieldLabel: p[1], mode: 'local', name: 'curr_' + p[0],
                store: options.controls[p[0]], allowBlank: false, editable: false, value: options['curr_' + p[0]]
            });
        });
        var fPanel = new Ext.FormPanel({labelWidth: 100,
            pdf_url: '',
            frame: true,
            border: false,
            items: [items,
                {buttons: [
                    {text: 'Update',  scope: this.m_App, handler: function() {
                        var preps = (optWindow.items.get(0).getForm().getValues());
                        Ext.apply(app.m_Config.Options, preps);
                        localStorage.setItem('NCBI/SV/Preferences', window.JSON.stringify(preps));
                        optWindow.close();
                        this.reloadAllViews();
                    }},
                    {text: 'Cancel', handler: function() {optWindow.close();}}]}]
        });

        optWindow.add(fPanel);
        optWindow.show();
    },

    createPDF: function(pos_range, options){
        var width = this.getScreenWidth() * (pos_range[1] - pos_range[0] + 1) / this.m_VisLenSeq;
        if (width > 8000){
            this.m_App.showMessage('Image is too wide (projected  width is ' + width + ' which is more than 8000 permitted)', true);
            return;
        }
        this.formPDF.getEl().mask('Creating PDF ...', 'x-mask-loading');
        this.formPDF.pdf_url = '';

        for (var i = 1; i < this.formPDF.buttons.length; i++){
            this.formPDF.buttons[i - 1].disable(); //everything except button 'Cancel'
        }
        // Instead of parsing/unparsing markers and making coords zero-based we instruct getGraphicParams
        // to return us stuff prepared for CGI use.
        var params = this.getGraphicParams(pos_range[0], pos_range[1] - pos_range[0] + 1, width, true);
        params.simplified = this.m_App.m_PDFcomp;
        params.target = 'pdf';
        params.pdftitle = this.m_App.m_PDFtitle;
        this.formPDF.filename = this.m_App.m_Config.SeqInfo.id + '[' + (params.from + 1) + '..' + (params.from + params.len) + ']'
        SeqView.App.simpleAjaxRequest({url: this.m_App.m_CGIs.Graphic, context: this, data: params,
            success: this.checkJobStatusPDF,
            error: this.checkJobStatusPDF
        });
    },

    checkJobStatusPDF: function(data, text, res) {
        var from_cgi = SeqView.decode(data);
        if (from_cgi.job_status) {
            if (from_cgi.job_status == 'failed' || from_cgi.job_status == 'canceled') {
                this.formPDF.getEl().unmask();
                this.m_App.showMessage(from_cgi.error_message, true)
            } else {
                if (from_cgi.progress_message && from_cgi.progress_message.length > 0) {
                    var progress_text = from_cgi.progress_message.replace(/\&quot;/gi, "\"");
                    var current_task = Ext.decode(progress_text).current_task;
                    if (current_task)
                        this.m_App.showMessage(current_task);
                }
                SeqView.App.simpleAjaxRequest.defer(500, this, [{
                    url: this.m_App.m_CGIs.Graphic + '?job_key=' + from_cgi.job_id,
                    context: this,
                    success: this.checkJobStatusPDF,
                    error: this.checkJobStatusPDF }]);
            }
       } else {
            if (from_cgi.pdf_url){
                // If the pdf_url begins with ? it contains only parameters for ncfetch, so prepend ncfetch URL
                // This is a way to provide reliable URL resolution for embedding. SV-1760
                if (from_cgi.pdf_url && from_cgi.pdf_url.charAt(0) == '?') {
                    from_cgi.pdf_url = this.m_App.m_CGIs.NetCache + from_cgi.pdf_url;
                }
                this.formPDF.pdf_url = from_cgi.pdf_url + '&filename=' + this.formPDF.filename + '.pdf';

                for (var i = 0; i < this.formPDF.buttons.length; i++)
                    this.formPDF.buttons[i].enable();
                var scope = this;
                var url = this.formPDF.pdf_url + '&inline=true';
                SeqView.makeTinyURL(url, function(res) {
                    if (res.id) url = res.id;
                    scope.formPDF.getEl().unmask();
                    scope.m_App.showMessage('<a href=' + url +' target=\"_blank\">' + url + '</a>');
                    scope.formPDF.doLayout();
                });
            } else {
                this.formPDF.getEl().unmask();
                this.m_App.showMessage('Request failed', true);
            }

        }
    },

//////////////////////////////////////////////////////////////////////////
// onDblClick:

    onDblClick: function(e) {
        if (!Ext.fly(e.getTarget()).hasClass('sv-dblclick'))
            return;

        if (this.m_Loading)
            return;

        var the_elem_xy = Ext.get(this.m_DivId).getXY();
        var xx = e.getXY()[0] - the_elem_xy[0] - this.m_ScrollPix;

        var pix = Math.abs(xx);//config['scroll_pix']) + e.getXY()[0] + the_elem_xy[0];
        var seq_pos = this.pix2Seq(pix);

        this.zoomIn(seq_pos);
    },

//////////////////////////////////////////////////////////////////////////
// createMarkerElem:

    createMarkerElem: function(marker) {
        var elem = Ext.get(this.m_DivId);
        var create_params = marker.getCreateParams(false, this.m_Idx);
        return create_params.template.append(elem, create_params.options, true);
    },

//////////////////////////////////////////////////////////////////////////
// changeSelectedSig:

    changeSelectedSig: function(area, ctrl_key) {
        // don't do anything for "graphics" and "histograms" and for fake areas
        if (area.type === undefined || (area.type & SeqView.AreaFlags.NoSelection) !== 0)
            return;

        var cur_sig = this.m_SelectedSig ? this.m_SelectedSig.split(';') : [];
        var new_sig = area.signature;
        if ( ctrl_key ) {
            var s_idx = cur_sig.indexOf(new_sig);
            if (s_idx != -1) {
                cur_sig.splice(s_idx,1);
            } else {
                cur_sig.push(new_sig);
            }
            new_sig = cur_sig.join(';');
        } else {
            this.removeSelectionsWithNoPinnedToolTips();
        }
        if (this.setSelectedSig(new_sig)) {
            SeqView.pingClick('6-0', 'Object_Selection');
            this.m_App.fireEvent('feature_clicked', this, area);
        }

    },

//////////////////////////////////////////////////////////////////////////
// setSelectedSig:
    setSelectedSig: function(new_sig) {
        if (!this.m_SelectedSig && !new_sig) return false;

        this.m_SelectedSig = (this.m_SelectedSig === new_sig) ? "" : new_sig;
        this.refresh();
        return true;
    },

//////////////////////////////////////////////////////////////////////////
// clearSelectedSig:
    clearSelectedSig: function() {
        return this.setSelectedSig("");
    },

//////////////////////////////////////////////////////////////////////////
// zoomRange:

    zoomRange: function() {
        var from, to;
        var range = this.getTotalSelectedRange();
        if (this.m_UrlFrom) {
            from = this.m_UrlFrom;
            to   = this.m_UrlTo;
        } else if (range[0] !== -1  &&  range[1] !== -1) {
            from = range[0];
            to   = range[1];
            this.removeRangeSelection(true);
            this.startImageLoading( from, to - from + 1, {from_ui: true} );
            return;
        } else {
            from = this.m_VisFromSeq + 1;
            to   = this.m_VisFromSeq + this.m_VisLenSeq;
        }
        this.gotoPositionDlg(true);
    },
//////////////////////////////////////////////////////////////////////////
// zoomIn:

    zoomIn: function(seq_pos) {
        var new_len  = Math.floor(this.m_VisLenSeq / 2);
        var center = seq_pos? seq_pos : this.m_VisFromSeq + new_len;
        var new_from = Math.floor(Math.max(0, center - new_len/2));
        if (new_from + new_len > this.m_App.m_SeqLength) new_len = this.m_App.m_SeqLength - new_from;

        this.startImageLoading( new_from, new_len, {from_ui: true} );
    },

//////////////////////////////////////////////////////////////////////////
// zoomSeq:

    zoomSeq: function( center_seq_pos ){

        if( !center_seq_pos ){
            center_seq_pos = Math.floor( this.m_VisFromSeq + this.m_VisLenSeq /2 );
        }

        var new_len  = Math.floor( this.getScreenWidth() * SeqView.MinBpp ); // 100 //config['vis_len_seq'] / 2000;
        var new_from = Math.floor( center_seq_pos - new_len /2 );
        if( new_from < 0 ){
            new_from = 0;
        }
        var app = this.m_App;
        if( new_from + new_len > app.m_SeqLength ){
            new_len = app.m_SeqLength - new_from;
        }
        var tracks_changed = app.showTracks({name:"Sequence"}, true);
        // should we call app.reloadAllViews here?
        this.startImageLoading( new_from, new_len, {from_ui: true} );
        if (tracks_changed) {
            app.fireEvent('configuration_changed', app);
        }
    },

//////////////////////////////////////////////////////////////////////////
// zoomOut:

    zoomOut: function(seq_pos) {
        var new_len  = this.m_VisLenSeq * 2;
        var center = seq_pos? seq_pos : this.m_VisFromSeq +  this.m_VisLenSeq / 2;
        var new_from = Math.max(0, center - new_len/2);
        if (new_from + new_len > this.m_App.m_SeqLength) new_len = this.m_App.m_SeqLength - new_from;
        this.startImageLoading( new_from, new_len, {from_ui: true} );
    },

//////////////////////////////////////////////////////////////////////////
// flipStrand:

    flipStrand: function() {
        this.setFlip(!this.getFlip());
    },

//////////////////////////////////////////////////////////////////////////
// parseAndGotoPosition:

    parseAndGotoPosition: function(text, range_only) {
        this.m_App.parseAndGotoPosition(text, {range_only: range_only, view: this});
    },

    gotoAndSearch: function( term ){
        var combo = Ext.getCmp( 'sv-goto-box_'+this.m_Idx );

        if( term == null || term.length == 0 ){
            //var combo = Ext.getCmp( 'sv-goto-box_'+this.m_Idx );

            if (combo && combo.el && combo.el.dom) {
                term = combo.el.dom.value;
            }
        }
        if ( !term ) return;

        combo.setValue( '' );

        var ix = -1;
        //indexOf( { pattern: term } );
        for( var i = 0, j = this.m_App.searchPatternData.length; i < j; i++ ){
            if( this.m_App.searchPatternData[i].pattern === term ){
                ix = i;
                break;
            }
        }

        if( ix == -1 ){
            var data = { pattern: term };

            this.m_App.searchPatternData[this.m_App.searchPatternData.length] = data;

            this.m_App.searchPatternStore.removeAll();
            var app = this.m_App;
            Ext.each( this.m_App.searchPatternData, function( data, x ){
                var r = new app.searchPatternStore.recordType( data, ++app.spsRecId ); // create new record
                app.searchPatternStore.insert( 0, r );
            });

            this.m_App.saveSearchPatternStore();
        }

        this.m_App.gotoAndSearch( term, {view: this} );
    },

    gotoPosRange: function(pos_range, center, options ){
        var new_from = pos_range[0];
        var len = this.m_VisLenSeq;
        if (pos_range.length === 2 && pos_range[1]) { // range is specified
            len =  pos_range[1] - new_from + 1;
        } else { // single position
            // according to SV-620 we want to keep the length of the current view in case if
            // it is less then 80% (?? it may change) of the sequence length
            if (len >= this.m_App.m_SeqLength * 0.8 ) {
                var new_center = new_from;
                if (new_center - 500000 < 0 && new_center + 500000 > this.m_App.m_SeqLength) {
                    if (new_center - 500 < 0 && new_center + 500 > this.m_App.m_SeqLength) {
                        var screen_width = this.getScreenWidth();
                        new_from = new_center - screen_width/8/2;
                        len = screen_width/8;
                    } else {
                        new_from = new_center - 500;
                        len = 1000;
                    }
                } else {
                    new_from = new_center - 500000;
                    len = 1000000;
                }
            } else if (center) new_from -= len / 2;

            if (new_from < 0) new_from = 0;
            if (new_from + len > this.m_App.m_SeqLength) {
                new_from -= new_from + len - this.m_App.m_SeqLength;
                if (new_from < 0) {
                    new_form = 0;
                    len = this.m_App.m_SeqLength;
                }
            }
        } // end single position
        this.startImageLoading(new_from, len, options);
    },

//////////////////////////////////////////////////////////////////////////
// gotoPositionDlg:

    gotoPositionDlg: function(range_only) {
        Ext.MessageBox.prompt(range_only ? "Zoom to range" : "Go to position/range",
          'Enter sequence ' + (range_only ? '' : 'position or') +
              ' range<br />(possible range formats are 10k-20k, -20--10, -10k:-5, 5 to 515, -1m..1m):',
          function(btn, text) {
              if (btn == 'ok') this.parseAndGotoPosition(text, range_only);
          }, this, false);
    },

    primerBlast: function(whole, range_set) {
        //check that range is not exceeding 50Kb

        var seqinfo = this.m_App.m_ViewParams;
        if (seqinfo["acc_type"] !== "DNA") return;
        if (!range_set) range_set = this.m_SelectedRangeSet;
        if (!whole  && (!range_set || range_set.length < 1)) {
            //open message window
            Ext.MessageBox.show({
               title: 'Primer BLAST (Selection)',
               msg: 'Cannot run BLAST - select a range first',
               buttons: Ext.MessageBox.OK//,
               //animEl: 'mb9',
               //fn: showResult,
               //icon: Ext.get('icons').dom.value
           });
           return;
        } else if (!whole  && (range_set && range_set.length > 2)) {
            //open message window
            Ext.MessageBox.show({
               title: 'Primer BLAST (Selection)',
               msg: 'Cannot run Primer BLAST on more than 2 ranges',
               buttons: Ext.MessageBox.OK//,
               //animEl: 'mb9',
               //fn: showResult,
               //icon: Ext.get('icons').dom.value
           });
           return;
        } else if (range_set && range_set.length == 1){
            var range = range_set[0];
            if(range[1]-range[0]>50000) {
                Ext.MessageBox.show({
               title: 'Primer BLAST',
               msg: 'Cannot run Primer BLAST on a range longer than 50K',
               buttons: Ext.MessageBox.OK//,
               });
               return;
            }
        } else if (range_set && range_set.length == 2){
            var range1 = range_set[0];
            var range2 = range_set[1];
            if((range2[1]-range1[0])>50000) {
                Ext.MessageBox.show({
               title: 'Primer BLAST',
               msg: 'Cannot run Primer BLAST on ranges longer than 50K',
               buttons: Ext.MessageBox.OK//,
               });
               return;
            }
        }
        if (whole)
            range_set = [ [0, this.m_App.m_SeqLength-1] ];
        this.m_App.primerBlast(whole, range_set);
    },

    blastSelection: function() {
        if (!this.m_SelectedRangeSet || this.m_SelectedRangeSet.length < 1)
        {
            //open message window
            Ext.MessageBox.show({
               title: 'BLAST Search (Selection)',
               msg: 'Cannot run BLAST - select a range first',
               buttons: Ext.MessageBox.OK//,
           });
            return;
        }
        var range = this.getTotalSelectedRange();
        this.m_App.blast(range);
    },

    openFullView: function(mode) {
        if (mode !== 'full') mode = 'portal';
        this.m_App.getLinkToThisPageURL(mode);
    },

    showAssmInfo: function() {
        var sts = ['Not set in the URL (and could not be guessed)',
                'Explicitly set from the URL',
                'Automatically determined by the provided molecule ID',
                'Detection failed due to timeout',
                'Conflict between the URL parameters: molecule ID and Assembly context'];
                
        var seqInfo = this.m_App.m_Config.SeqInfo;
        var wrn = seqInfo.warning_message;
        var msg = 'Name: ' + seqInfo.assm_info.name + '<br/>TaxID: ' + seqInfo.assm_info.tax_id
            + '<br/> Type: ' + (seqInfo.assm_info.type ? 'GenBank' : 'RefSeq')
            + '<br/>' + sts[seqInfo.assm_context_status];
        if (wrn) msg += '<br/> WARNING! ' + wrn;
        Ext.MessageBox.show({
            icon: wrn ? Ext.MessageBox.WARNING : Ext.MessageBox.INFO, 
            title: 'Genomic Assembly Context',
            msg: msg,
            buttons: Ext.MessageBox.OK
        });
        return;
        
    }
}) })();  // End Of SeqView.Graphic
/*  $Id: tm_panels.js 34247 2015-12-03 22:08:20Z rudnev $
*/


Ext.namespace('SeqView.TM');

////////////////////////////////////////////////////////////////////////
//

SeqView.TM.updateTrackDetails = function(panel, track){
    if (track.choice_list) {
        Ext.each(track.choice_list, function(lst) {
            var data = [];
            var cur_value = '';
            var cur_legend = null;
            Ext.each(lst.values, function(v) {
                data.push(v.display_name);
                if (lst.curr_value == v.name) {
                    cur_value = v.display_name;
                    cur_legend = track.help;
                }
            });
            var cb = new  Ext.form.ComboBox({
                disabled: !track.shown,
                plugins:new Ext.ux.plugin.triggerfieldTooltip(),
                tooltip: {text: lst.help},
                getItemToolTip: function(i) {
                    var text = this.choiceLst.values[i].help;
                    return {text: text};
                },
                fieldLabel: lst.display_name,
                mode    :'local',
                store   : data,
                width   : 350,
                triggerAction:'all',
                value: cur_value,
                editable:false,
                allowBlank:false,
                choiceLst: lst,
                listeners: {
                    select: function(f,r,i){
                        var oldvalue = f.choiceLst.curr_value;
                        if (oldvalue != f.choiceLst.values[i].name )  {
                            f.choiceLst.curr_value = f.choiceLst.values[i].name;
                        }
                    }
                }
            });
            panel.add(cb);
        });
    }
    if (track.check_boxes) {
        for(var i = 0; i < track.check_boxes.length; ++i) {
            var cbox = track.check_boxes[i];
            var item = new Ext.form.Checkbox({
                disabled: !track.shown,
                boxLabel:cbox.display_name,
                checked: cbox.value,
                tooltip:cbox.help,
                rcbox: cbox,
                listeners: {
                    check: function(cb, checked) {
                        cb.rcbox.value = checked;
                    }
                }
            });
            if (i == 0) {
                item.fieldLabel = 'Other Settings';
            } else {
                item.fieldLabel = '&nbsp;';
                item.labelSeparator = '';
            }
            panel.add(item);
        }
    }
    if (track.text_boxes)
        for (var i = 0; i < track.text_boxes.length; i++) {
            var tbox = track.text_boxes[i];
            if (tbox.name == 'HistThreshold') {
                var item = new Ext.form.NumberField({
                    fieldLabel: tbox.display_name,
                    allowNegative: false,
                    emptyText: 'None',
                    value: tbox.value || 0,
                    rtbox: track.text_boxes[i],
                    tooltip: tbox.help,
                    listeners: {
                        change: function(tb, nval, oval) {
                            if (nval == 0) tb.setValue('undefined');
                            tb.rtbox.value = nval || 0;
                        },
                        render: function(tb) {
                            if (tb.value == 0) tb.setValue('undefined');
                            Ext.QuickTips.register({
                                target: tb.getEl(),
                                text: tb.tooltip
                            });
                        }
                    }
                });
            }
            if (item) panel.add(item);
        }
    panel.doLayout();
};

SeqView.TM.TrackDetail = Ext.extend(Ext.Panel, {
    initComponent: function() {
        Ext.apply(this, {
            bodyStyle: {
                //collapsible: true,
                //collapsed: true,
                background: '#F0F0F0',
                padding: '5px',
                'overflow-y': 'auto',
                'overflow-x': 'hidden'

            },
            title: 'Track Settings',
            layout: 'form',
            labelWidth: 130
        });
        SeqView.TM.TrackDetail.superclass.initComponent.call(this);
    },
    updateDetail: function(rdata, rowYpos) {
        var panel = this;

        this.items.each(function(item) {
            panel.remove(item);
        });
        var tname = rdata.display_name || rdata.name;
        panel.setTitle( "Track Settings: " + tname );
        if (rdata.help) {
            panel.add({
                xtype:'fieldset',
                style: 'padding: 5px;',
                items: {xtype:'displayfield', hideLabel: true, value: /*rdata.LegendText*/rdata.help}
            });
        }
        if (rdata.choice_list.length == 0 && rdata.check_boxes.length == 0) {
            panel.add({xtype:'displayfield', hideLabel: true, value: "<i>No settings available</i>"});
        }
        SeqView.TM.updateTrackDetails(panel, rdata);
        panel.ownerCt.doLayout();
    }
});


////////////////////////////////////////////////////////////////////////
//
SeqView.TM.collectAllTracks = function(categories, activeOnly) {
    var collected_tracks = [];
    Ext.each(categories, function(cat) {
        Ext.each(cat.subcategories, function(subcat) {
            Ext.each(subcat.tracks, function(track) {
                if (track.shown || !activeOnly ) {
                    if (cat.name && cat.name != 'other')
                        track.cat_name = cat.name;
                    else
                        delete track.cat_name;
                    if (subcat.name && subcat.name != 'other')
                        track.subcat_name = subcat.name;
                    else
                        delete track.subcat_name;
                    collected_tracks.push(track);
                }
            });
        });
    });
    collected_tracks.sort(function(t1,t2) {
        return t1.order - t2.order;
    });
    return collected_tracks;
}

SeqView.TM.collectActiveTracks = function(categories) {
    return SeqView.TM.collectAllTracks(categories, true);
}

////////////////////////////////////////////////////////////////////////
//
SeqView.TM.Category =  Ext.extend(Ext.Panel, {

    initComponent : function(){
        this.title = this.category.display_name;
        this.layout = 'fit',

        this.items = new SeqView.TM.TracksPanel({
            subcategories: this.category.subcategories
        });

        SeqView.TM.Category.superclass.initComponent.call(this);
    },
    reloadTracks: function() {
        this.items.each(function(item) {
            item.reloadTracks();
        });
    }
});

////////////////////////////////////////////////////////////////////////
//
SeqView.TM.TracksPanel = Ext.extend(Ext.Panel, {
    // override initComponent
    initComponent: function() {
        if (this.subcategories) {
            this.gridPanel = this.subcategories.length != 1
                ? new SeqView.TM.GroupGrid({ subcategories: this.subcategories })
                : new SeqView.TM.Grid({tracks: this.subcategories[0].tracks});
        } else {
                if (this.activeTracks)
                    this.gridPanel = new SeqView.TM.ActiveTracksGrid({tracks: this.tracks});
                else 
                    this.gridPanel = (this.searchTracks)
                        ? new SeqView.TM.searchTracksTab(null, this.tracks_config)
                        : new SeqView.TM.Grid({tracks: this.tracks});
        }
        Ext.apply(this.gridPanel, { region: 'center' });
        if (!this.searchTracks)
            this.detailPanel = new SeqView.TM.TrackDetail({
                region: 'south',
                split: true,
                height: 250,
                minSize: 100,
                collapsible: true
            });
        var items = [];
        if (this.activeTracks) {
            var hintStr = {
                region: 'north',
                border: false,
                bodyStyle: { padding: '5px 5px 5px 5px', 'font-size': '14px' },
                html: 'Click on track to display settings. To re-order tracks, drag and drop track names.'
            };
            items.push(hintStr, this.gridPanel, this.detailPanel);
        } else if (this.searchTracks) {
            var sbar = new Ext.Panel({
                region: 'north',
                border: false,
                tbar: ['-',' Search: ', ' ', new Ext.ux.form.SearchField({store: this.gridPanel.store, width: 220})]
            }); 

            items.push(sbar, this.gridPanel);
        }
        else items.push(this.gridPanel, this.detailPanel);
        Ext.apply(this, {
            border: false,
            layout: 'border',
            items: items
        });
        SeqView.TM.TracksPanel.superclass.initComponent.call(this);
    },
    // override initEvents
    initEvents: function() {
        SeqView.TM.TracksPanel.superclass.initEvents.call(this);
        var trackGridSm = this.gridPanel.getSelectionModel();
        trackGridSm.on('rowselect', this.onRowSelect, this);
        this.gridPanel.on('viewready', function(g) {
            g.getSelectionModel().selectRow(0);
        });
    },
    onRowSelect: function(sm, rowIdx, r) {
        if (!this.detailPanel) return;
        var row = this.gridPanel.getView().getRow(rowIdx);
        this.detailPanel.updateDetail(r.data, Ext.get(row).getY());
        var group_button = Ext.getCmp('sv-config_group_button');
        var group = r.data.setting_group;
        if (group) {
            group_button.show();
            group_button.track = r.data;
            var display_name = group;
            var display_limit = 10;
            if (group.length > display_limit) {
                display_name = group.substr(0, display_limit) + "...";
            }
            group_button.setText("Configure Group '" + display_name + "'");
        } else {
            group_button.hide();
        }
    },
    reloadTracks: function(tracks) {
        if (this.gridPanel.reloadTracks)
            this.gridPanel.reloadTracks(tracks);
    }
});

////////////////////////////////////////////////////////////////////////
//
SeqView.TM.MainPanel =  Ext.extend(Ext.Panel, {
    initComponent : function(){
        Ext.apply(this, {
            title: 'Tracks',
            layout: 'fit',
            itemId: 'trackpanel',
            dirty: false,
            items: this.createPanel(),
            listeners: {
                show: function(p) {
                    p.doLayout();
                }
            }
        });
        SeqView.TM.MainPanel.superclass.initComponent.call(this);
    },

    reload: function(categories) {
        this.removeAll();
        this.categories = categories;
        this.dirty = false;
        var panel = this.createPanel();
        this.add(panel);
        if (this.isVisible())
            this.doLayout();
    },

    createPanel: function() {
        var tracks_config = this.sviewApp.m_Config.TrackConfig;
        var categories = this.categories;
        var tabs = [];
        this.actTracksTab = new SeqView.TM.TracksPanel({
            title: 'Active Tracks',
            iconCls: 'xsv-seq-logo',
            activeTracks: true,
            tracks_config: tracks_config,
            tracks: [],
            listeners: {
                deactivate: function() {
                    this.gridPanel.syncModifiedTracks(this.tracks_config);
                }
            }
        });
        tabs.push(this.actTracksTab);
        this.actTracksTab.reloadTracks(SeqView.TM.collectActiveTracks(categories));
        tabs.push(new SeqView.TM.TracksPanel({
            title: 'Search Tracks',
            iconCls: 'xsv-search-button',
            searchTracks: true,
            tracks_config: tracks_config,
            searchStr:'*',
            listeners: {
                deactivate: function(p) {
                    this.gridPanel.syncModifiedTracks();
                }
            }
        }));
        Ext.each(categories, function(cat) {
            var catTab = new SeqView.TM.TracksPanel({
                title: cat.display_name,
                layout: 'fit',
                category: cat,
                subcategories: cat.subcategories,
                tracks_config: tracks_config,
                listeners: {
                    deactivate: function(p) {
                        this.gridPanel.syncModifiedTracks(this.tracks_config);
                    }
                }
            });
            catTab.reloadTracks();
            tabs.push(catTab);
        });
        var panel = new Ext.ux.tot2ivn.VrTabPanel({
            activeTab: 0,
            plain:true,
            tabWidth: 158,
            items: tabs
        });
        return panel;
    },

    setDirty: function(flag) {
        this.dirty = (flag === true);
    }
});

////////////////////////////////////////////////////////////////////////
//
Ext.override(Ext.form.BasicForm, {
    beforeAction : function(action){
        // Call HtmlEditor's syncValue before actions
        this.items.each(function(f){
            if(f.isFormField && f.syncValue){
                f.syncValue();
            }
        });
        var o = action.options;
        if(o.waitMsg){
            if(this.waitMsgTarget === true){
                this.el.mask(o.waitMsg, 'x-mask-loading');
            }else if(this.waitMsgTarget){
                this.waitMsgTarget = Ext.get(this.waitMsgTarget);
                this.waitMsgTarget.mask(o.waitMsg, 'x-mask-loading');
            }else{
                Ext.MessageBox.show({wait:true, msg:o.waitMsg, title:(o.waitTitle || this.waitTitle), icon: (o.waitIcon ||'ext-mb-download')});
            }
        }
    }
});

SeqView.TM.UploadPanel =  Ext.extend(Ext.Panel, {
    initComponent : function(){
        Ext.apply(this, {
            title: 'Custom Data',
            layout: 'border',
            itemId: 'uploadpanel',
            infoMsg: 'No informations or details',
            items:[{
                region: 'west', split: true, layout:'fit', width: 160, title:'Data Source',
                items: [{
                    loader: new Ext.tree.TreeLoader(),
                    rootVisible:false, enableDD:false, lines:false, xtype:'treepanel', autoScroll:true,
                    listeners: { 'click': function(node, e) {
                        this.uploadButt.disable();
                        this.cancelUploadButt.disable();
                        
                        var new_panel = this.createPanels(node.attributes.type);
                        var panel = Ext.getCmp('loaddatapanel');
                        var dp = panel.getComponent('diff_part');
                        var form = panel.getForm();
                        for (var i = 0, len = dp.items.getCount(); i < len; i++) {
                            var it = dp.get(i);
                            form.remove(it);
                        };
                        panel.remove(dp);
                        panel.insert(0, new_panel);
                        panel.setTitle(node.text);
                        panel.doLayout();
                        if (node.attributes.type == 'file') {
                            var uPanel = this;
                            var dfn = document.getElementById('data_file_name');
                            if (!dfn) return;
                            {
                                new_panel.add(
                                   {xtype: 'fieldset', title: 'Drag and drop file here', id: 'sv_dropzone', height: 60, labelWidth: 1,
                                    items: [{xtype: 'displayfield', id: 'sv_dz_fname', value: ''}]});
                                panel.doLayout();
                                var dzone = document.getElementById('sv_dropzone');
                                var msg_fld = Ext.getCmp('sv_dz_fname');
                                dfn.onchange = function(e) {
                                    if (this.files.length == 0) {
                                        msg_fld.update('');
                                        delete uPanel.dzfile;
                                        uPanel.uploadButt.disable();
                                    } else {
                                        uPanel.dzfile = this.files[0];
                                        uPanel.dzfile.msg_fld = msg_fld;
                                        msg_fld.update(uPanel.dzfile.name);
                                        uPanel.uploadButt.enable();
                                    }
                                };
                                dzone.ondragover = function(){ return false; };
                                dzone.ondragleave = function(){ return false; };
                                dzone.ondrop = function(e) {
                                    e.preventDefault();
                                    uPanel.reset();
                                    uPanel.dzfile = e.dataTransfer.files[0];
                                    uPanel.dzfile.msg_fld = msg_fld;
                                    msg_fld.update(uPanel.dzfile.name);
                                    uPanel.uploadButt.enable();
                                    SeqView.pingClick('9-5-DnD');
                                    return false;
                                };
                            }
                        };
                    }, scope: this},
                    root: new Ext.tree.AsyncTreeNode({children:[
                        {text:'BLAST Results', type:'rid', iconCls:'xsv-ext_data',leaf:true},
                        {text:'Data File', type:'file', iconCls:'xsv-ext_data',leaf:true},
                        {text:'URL', type:'url', iconCls:'xsv-ext_data',leaf:true},
                        {text:'Text', type:'text', iconCls:'xsv-ext_data',leaf:true}
                    ]}) // root
                }]
            },{
                frame:true,
                xtype:'form',
                region: 'center',
                bodyStyle:'padding:5px;',
                url: this.cfgPanel.sviewApp.m_CGIs.SvDataUpload,
                hidden: false,
                id:'loaddatapanel',
                fileUpload: true,
                items:[
                    this.createPanels('rid'),
                    {xtype:'panel', layout: 'form', bodyStyle: { 'padding-top': '10px'},
                     items:[
                        {xtype:'textfield', fieldLabel:'Track Name', id:'track_name', name:'track_name', width:'95%'},
                        {xtype:'hidden', name:'assm_acc', value: this.cfgPanel.sviewApp.m_AssmContext || ""},
                        {xtype:'displayfield', id: 'sv-uplmsg' + this.cfgPanel.sviewApp.m_DivId, value: '',
                         style: {color:'grey', "text-align": 'left', "margin-top":'10px', "margin-left":'6px'}},
                        {xtype:'displayfield', id: 'sv-uplerr' + this.cfgPanel.sviewApp.m_DivId, value: '',
                         style: {color:'red', "text-align": 'left', "margin-top":'10px', "margin-left":'6px'}},
                        {xtype: 'button', hidden: true, scope: this, handler: this.showErrorDetails,
                         id: 'sv-err_details_button_id'}
                        ,{xtype: 'button', text: 'Track(s) details', hidden: true, scope: this, handler: this.showUpTracksDetails,
                         id: 'sv-discover_track_button_id'}
                    ]}
                ]
            }],
            buttons: [{
                text:'Upload', scope:this, id: 'sv-upload_butt',
                disabled: true,
                handler:function(b, e) {
                    e.stopPropagation();
                    e.preventDefault();
                    var form = this.get(1).getForm();
                    if (!form.isValid()) return;
                    if (form.isDirty() || this.dzfile) {
                        this.submitData(form);
                    }
                    else {
                        this.cfgPanel.sviewApp.showMessage("Inputs are empty or invalid!", true);
                    }
                    SeqView.pingClick('9-5-' + form.getFieldValues().input_form);
                }
            }, 
            {
                text:'Cancel', scope:this, id: 'sv-cancel_upload_butt',
                hidden: true,
                disabled: true,
                handler: function(b, e) {
                    e.stopPropagation();
                    e.preventDefault();
                    if (this.uploaderUUD) {
                        this.uploaderUUD.cancel();
                        delete this.uploaderUUD;
                    }
                }
            }]
        });
        SeqView.TM.UploadPanel.superclass.initComponent.call(this);
        this.uploadButt = Ext.getCmp('sv-upload_butt');
        this.cancelUploadButt = Ext.getCmp('sv-cancel_upload_butt');
    },
    showErrorDetails: function() {
        if (this.infoMsg == '') return;
        var mbw = new Ext.Window({title: 'Error details',
            modal: true, layout:'fit',
            width: 400, height: 300});
        mbw.add(new Ext.FormPanel({ labelWidth: 1, autoScroll: true,
            items:[
               {xtype: 'displayfield', value: this.infoMsg, textalign: 'left'}],
        	   buttons:[{text: 'OK', handler: function() {mbw.close();}}]})
        );
        mbw.show();
    },
    Sec2Time: function(sec) {
        var hours   = Math.floor(sec / 3600);
        var minutes = Math.floor((sec - (hours * 3600)) / 60);
        var seconds = sec - (hours * 3600) - (minutes * 60);
        var time = '';
        if (hours > 0) 
            time = hours + ' hour' + ((hours > 1) ? 's ' : ' ');
        if (minutes > 0)
            time += minutes + ' minute' + ((minutes > 1) ? 's ' : ' ');
        if (seconds > 0)
            time += seconds + ' second' + ((seconds > 1) ? 's' : '');
        return time;
    },
    updateMessage: function() {
        this.currTime++;
        this.totalTime++;

        var msg = '<br>';
        msg += 'Total time: ' + this.Sec2Time(this.totalTime) + '<br>';
        for (var i = 0; i < this.tasks.length; i++)
            msg += this.tasks[i].task + ": " + this.tasks[i].time + " seconds<br>";
        msg += this.currTask + ": " + this.Sec2Time(this.currTime);
        if (this.percentage) {
            var time = this.Sec2Time(Math.round(this.currTime * (100/this.percentage - 1)));
            if (time.length > 0) 
                msg += " (" + time + " remaining)";
        }
        msg += '<br>';
        if (this.percentage) msg += 'Percentage: ' + this.percentage + '%<br>';
        this.cfgPanel.sviewApp.showMessage(msg);
        this.updateMessageWrap.defer(1000, this, []);
    },

    updateMessageWrap: function() {
        if (this.uploaderUUD) this.updateMessage("");
    },

    showUpTracksDetails: function(tracks) {
        var store = new Ext.data.Store({
            autoLoad:false,
            remoteSort:false,
            loading: false,
            reader: new Ext.data.ArrayReader({
                fields: [
                    {name:'title', convert: function(v, rec){ return rec.title }},
                    {name:'annot_name', convert: function(v, rec){ return rec.annot_name }},
                    {name:'track_type', convert: function(v, rec){ return rec.track_type }}]
            }),
            data: this.infoUpTracks
        });
        var panel = new Ext.grid.GridPanel({ 
            store: store,
            border:false,
            loadMask:true,
            stripeRows:true,
            first_click: false,
            cm: new Ext.grid.ColumnModel([
               {header: "Title", width: 80, sortable: true, dataIndex: 'title'},
               {header: "Annotation name", sortable: true, dataIndex: 'annot_name'},
               {header: "Track type", width: 30, sortable: true, dataIndex: 'track_type'}
            ]),
            viewConfig: {forceFit:true, deferEmptyText:false, emptyText:'<div align="center">No track(s) info to display</div>',
                templates: {
                    cell: new Ext.Template('<td class="x-grid3-col x-grid3-cell x-grid3-td-{id} x-selectable {css}" style="{style}" tabIndex="0" {cellAttr}>',
                        '<div class="x-grid3-cell-inner x-grid3-col-{id}" {attr}>{value}</div>', '</td>')
                }
            },
            autoExpandColumn: 'title',
            bbar:new Ext.PagingToolbar({
                 pageSize:50, store: store,
                 displayInfo:true, displayMsg:'Displaying track(s) details {0} - {1} of {2}', emptyMsg: "No track(s) info to display"
            })
        });
        store.panel = panel;
        panel.toolbars[0].remove(panel.toolbars[0].refresh.id);
        
        var window = new Ext.Window({
           layout:'fit',
           title:'Uploaded track(s)',
           minWidth:480, width:650, height:350,
           constrain:true,collapsible:true,
           cls: 'SeqViewerApp',
           closeAction: 'close',
           plain: true
       });
       window.add(panel);
       window.show();
    },

    reset: function() {
        var form = this.get(1).getForm();
        if (this.dzfile) {
            this.dzfile.msg_fld.update('');
            delete this.dzfile;
        }
        var flds = ['blast_rid', 'data_file_name', 'data_url', 'data_text'];
        for (var i = 0, len = flds.length, f = null; i < len; ++i) {
            if (form.items.keys.indexOf(flds[i]) && (f = form.items.get(flds[i]))) {
                f.setValue('');
                // fixing EI8+ security restriction regarding HTML File Upload Control
                if (f.getValue() != '' && i == 1) {
                    document.getElementById(flds[i]).parentNode.innerHTML = document.getElementById(flds[i]).parentNode.innerHTML;
                    var uPanel = this;
                    var dfn = document.getElementById(flds[i]);
                    dfn.onchange = function(e) {
                        if (this.value) uPanel.uploadButt.enable(); else uPanel.uploadButt.disable();
                        uPanel.cancelUploadButt.disable();
                    }
                }
            }
        }
    },

    cleanupUpload: function(msg) {
        if (this.cfgPanel.cfgWindow)
            this.cfgPanel.cfgWindow.cancelAction = null;
        delete this.uploaderUUD;
            if (this.cancelUploadButt) this.cancelUploadButt.disable();

        var button = Ext.getCmp('sv-configure_button_id')
        if (button) button.enable();
        if (msg) this.cfgPanel.sviewApp.showMessage(msg, true);
    },
    
    submitData: function(form){
        this.currTime = this.totalTime = this.percentage = 0;
        this.currTask = 'uploading file';
        this.tasks = [];

        Ext.getCmp('sv-err_details_button_id').hide();
        Ext.getCmp('sv-discover_track_button_id').hide();
        Ext.getCmp('sv-configure_button_id').disable();
        if (this.uploadButt)
            this.uploadButt.disable();
        if (this.cancelUploadButt)
            this.cancelUploadButt.disable();
        this.cfgPanel.sviewApp.showMessage('');
        this.cfgPanel.sviewApp.showMessage('', true);

        var config = {assm_acc: this.cfgPanel.sviewApp.m_AssmContext};

        for (var i = 0; i < form.items.length; i++) {
            var item = form.items.items[i];
            if (!item.hasOwnProperty('name')) continue;
            var val = item.getValue();
            if (typeof val == 'string' && val.length == 0) continue;
            config[item.name] = val;
        }
        var find_comp = config.find_comp || false;
        delete config.find_comp;
        if (config.rid) config.blast = {rid: config.rid, link_related_hits: find_comp};
        else config.check_cs = true;
        var uPanel = this;
        uPanel.consError = console.error;
        console.error = function() {}
        var finalize = function(msg) {
            console.error = uPanel.consError || console.error;
            delete uPanel.consError;
            uPanel.cleanupUpload(msg);
            if (!msg) {
                var msg = 'Data uploaded';
                if (uPanel.cfgPanel.sviewApp.m_AssmContext) {
                    msg += " on assembly " + uPanel.cfgPanel.sviewApp.m_AssmContext;
                }
                uPanel.cfgPanel.sviewApp.showMessage(msg);
                var dTrk = Ext.each(uPanel.infoUpTracks, function() { return (this.track_type == 'non-displayable_track') });
                if (typeof dTrk == 'undefined') uPanel.cfgPanel.sviewApp.showMessage('There is no data that can be displayed on the sequence', true);
            }
            uPanel.reset();
            if (uPanel.exitCallback) {
                var tmpobj = uPanel.exitCallback;
                delete uPanel.exitCallback;
                tmpobj.callback.call(tmpobj.scope);
            }
        }

        if (this.dzfile) config.file = this.dzfile;
        try {
            this.uploaderUUD = new UUD.FileUploader(config);
            var promise = this.uploaderUUD.getPromise();
            promise.fail(function(){
                finalize('Failed to upload data: ' + this.getErrors());
            });
            promise.done(function(tlist, dkey) {
                uPanel.infoUpTracks = this.getTracks();
                if (uPanel.infoUpTracks) {
                    Ext.each(uPanel.infoUpTracks, function() { uPanel.cfgPanel.sviewApp.addUploadedTrackID(this);});
                    uPanel.ownerCt.getComponent('trackpanel').setDirty(true);
                }
                var errMsg = this.getErrors();
                if (errMsg.length) {
                    uPanel.infoMsg = '';
                    Ext.each(errMsg, function(msg, idx){
                        this.infoMsg +='# ' + (idx + 1) + '. ' + msg + '<br>';
                    }, uPanel);
                    
                    var bttn = Ext.getCmp('sv-err_details_button_id');
                    var bttxt ='Data parsing error details (' + errMsg.length + ')';
                    bttn.setText(bttxt);
                    bttn.show();
                }
                finalize();
            });
            promise.progress(function(progress) {
                if (progress.percentage) uPanel.percentage = progress.percentage;
                var task = progress.current_task;
                if (task == "" || task == 'pending' || task == uPanel.currTask) return;

                uPanel.tasks.push({task: uPanel.currTask, time: uPanel.currTime});
                uPanel.currTask = task;
                uPanel.currTime = 0;
            });
            this.uploaderUUD.upload();
        } catch(e) { finalize('Unable to upload data: ' + e.message); } 
    
        this.updateMessage();
    },

    createPanels: function(name) {
        var uPanel = this;
        this.fileUploadDisabled = Ext.isIE && !(Ext.isIE11 || Ext.isIE10);
        var manageButt = function(self) {
            if (self.getValue().length) uPanel.uploadButt.enable(); else uPanel.uploadButt.disable();
            uPanel.cancelUploadButt.disable();
        }
        switch(name) {
            case 'rid':
            return new Ext.Panel({
                id: 'diff_part',
                items: rid_items = [
                    {xtype:'displayfield', value: 'Please enter NCBI BLAST request ticket (RID) then press Upload to add new alignment track.',
                     width:'95%',  style: {paddingBottom: '10px', fontSize: '122%'} },
                    {xtype:'textfield', id:'blast_rid', hideLabel:true, emptyText:'Please enter Blast RID', name: name, width:'95%',
                        listeners: { valid: manageButt }},
                    {xtype:'checkbox', id:'find_comp', name: 'find_comp', height:25, boxLabel:'Link related hits together',  checked:true},
                    {xtype:'displayfield', value: 'BLAST returns separate alignments for each query, and these separate alignments can further be ordered into sets offering consistent non-overlapping query and subject coverage.  The sequence viewer offers the ability to evaluate the original BLAST hits on-the-fly and link together alignments that meet a strict definition of non-overlapping query and subject coverage.',
                     width:'95%' }
                ]
            });
            case 'file':
                var helpTxt = (this.fileUploadDisabled ? 'File upload is unavailable in Internet Explorer versions 9 and earlier' :
                    (SeqView.jsonType == 'JSONP' ? 'Local files uploading is currently unavailable for X-domain/IE configuration' : ''));
            return new Ext.Panel((helpTxt)
                ? { id: 'diff_part',
                items: [{xtype:'displayfield', value: helpTxt,
                        width:'95%',  style: {paddingBottom: '10px', fontSize: '122%', color: 'red'} }] }
                : { id: 'diff_part',
                items: [
                    {xtype:'displayfield', value: 'Please specify or drop an input file then press Upload to add new track(s).',
                     width:'95%',  style: {paddingBottom: '10px', fontSize: '122%'}},
                    {xtype:'panel', id:'sv-upload_browsebutton', layout: 'form',
                        items: [
                            {xtype: 'textfield',  id:'data_file_name', autoHeight:true, inputType:'file', fieldLabel:'File to upload', name:'file'},
                            {xtype: 'combo', triggerAction:'all', width:120, name:'file_format', fieldLabel:'File format', mode:'local',
                                store:['auto detect','asn binary','asn text','bed','bed 15', 'fasta','gff2', 'gff3', 'gtf/gff', 'gvf', 'vcf', 'wiggle', 'xml'], allowBlank:false,
                                editable:false, value:'auto detect'
                            }
                        ]
                    }
                ]
            });
            case 'url':
            return new Ext.Panel({
                id: 'diff_part',
                items: [
                    {xtype:'displayfield', value: 'Please specify the WEB URL to download the input file then press Upload to add new track(s).',
                     width:'95%',  style:{paddingBottom: '10px', fontSize: '122%'} },
                    {xtype:'textfield', id:'data_url', hideLabel:true, emptyText:'Please enter URL', name:'dataURL', width:'95%', listeners: {valid: manageButt}}
                ]
            });
            case 'text':
            return new Ext.Panel({
                id: 'diff_part',
                items: [
                    {xtype:'displayfield', value: 'Please paste you text annotations then press Upload to add new track.',
                     width:'95%',  style:{paddingBottom: '10px', fontSize: '122%'} },
                    {xtype:'textarea', id:'data_text', hideLabel:true, emptyText:'Please paste your text here', name:'data', width:'95%', height:135,
                        listeners: {valid: manageButt}}
                ]
            });
            default:
            return null;
        }
        return null;
    }
});
/*  $Id: tm_dialog.js 34247 2015-12-03 22:08:20Z rudnev $
*/

function encodeKeyVal(s, key, val, f_escape) {
    if (val && val.length > 0) {
        s += (s.length > 0 ? ',' : '') + key + ':' + (f_escape ?  SeqView.escapeTrackName(val) : val);
    }
    return s;
}


SeqView.TM.processTracksInfo = function(cgi_tracks) {
    var ret = [];
    var search_category = function(categories, cat_name) {
        var scat = null;
        Ext.each(categories,function(cat) {
            if (cat.name == cat_name) {
                scat = cat;
                return false;
            }
        });
        return scat;
    }
    var uu_id = 0;
    var next_id = function() {
        return uu_id++;
    }
    Ext.each(cgi_tracks,function(ctrack) {
        var cat = null;
        ctrack.uuid = next_id();
        if( !ctrack.display_name ){
            if( !ctrack.name || ctrack.name.length == 0 ){
                ctrack.name = "track_" + ctrack.uuid;
                ctrack.display_name = "Track " + ctrack.uuid;
            } else {
                ctrack.display_name = "Track " + ctrack.name;
            }
        } else {
            if( !ctrack.name || ctrack.name.length == 0 ){
                ctrack.name = "track_" + ctrack.display_name;
            }
        }
        if (!ctrack.order && ctrack.order !== 0)
            ctrack.order = 100;
        if(ctrack.category) {
            cat = search_category(ret,ctrack.category.name)
            if (!cat) {
                cat = Ext.ux.clone(ctrack.category);
                cat.subcategories = [];
                ret.push(cat);
            }
        } else {
            cat = search_category(ret,"other")
            if (!cat) {
                cat = {name:"other", display_name:"Other", help: "Other tracks"};
                cat.subcategories = [];
                ret.push(cat);
            }
        }
        var subcat = null;
        if (ctrack.subcategory) {
            subcat = search_category(cat.subcategories,ctrack.subcategory.name)
            if (!subcat) {
                subcat = Ext.ux.clone(ctrack.subcategory);
                subcat.tracks = [];
                cat.subcategories.push(subcat);
            }
        } else {
            subcat = search_category(cat.subcategories,"other")
            if (!subcat) {
                subcat = {name:"other", display_name:"Other", help: "Other tracks"};
                subcat.tracks = [];
                cat.subcategories.push(subcat);
            }
        }
        subcat.tracks.push(ctrack);
    });
    ret.sort(function(a, b) { return a.order - b.order; });
    return ret;
};

////////////////////////////////////////////////////////////////////////////////////////////////
//
SeqView.TM.trackToString = function(track, for_group) {

    var str = '';

    str = encodeKeyVal(str, 'key', track.key);
    if (for_group) {
        str = encodeKeyVal(str, 'group_name', track.setting_group);
    } else {
        str = encodeKeyVal(str, 'name', track.name, true);
        str = encodeKeyVal(str, 'display_name', track.display_name, true);
        str = encodeKeyVal(str, 'id', track.id, true);
        str = encodeKeyVal(str, 'data_key', track.data_key, true);
        str = encodeKeyVal(str, 'subkey', track.subkey);
        str = encodeKeyVal(str, 'category', track.cat_name);
        str = encodeKeyVal(str, 'subcategory', track.subcat_name);
        str = encodeKeyVal(str, 'dbname', track.dbname, true);
        str = encodeKeyVal(str, 'uid', track.uId, true);
        Ext.each(track.subTracks, function(subtrack, idx) {
            str += idx == 0 ? ',subtracks:' : '|';
            str += SeqView.escapeTrackName(subtrack);
        });
        Ext.each(track.annots, function(annot, idx) {
            str += idx == 0 ? ',annots:' : '|';
            str += SeqView.escapeTrackName(annot);
        });
        Ext.each(track.comments, function(comment, idx) {
            str += idx == 0 ? ',comments:' : '|';
            str += SeqView.escapeTrackName(comment.label) + '|' + comment.pos_str;
        });
        Ext.each(track.highlights, function(hl, idx) {
            str += idx == 0 ? ',highlights:' : '|';
            str += SeqView.escapeTrackName(hl);
        });
        if (track.filter && track.filter.length > 0) {
            // Do not escape the bar '|'
            str += ',filter:' + SeqView.escapeTrackName(track.filter, /([\]\[\\,:=&;"#%])/);
        }
    }
    str += SeqView.TM.getTrackDisplayOptions(track);

    if (track.is_private) str += ',is_private:true';
    if (track.is_scaled) str += ',is_scaled:' + track.is_scaled;

    return str;
}

SeqView.TM.getTrackDisplayOptions = function(track) {
    var str = '';
    Ext.each(['choice_list', 'check_boxes', 'text_boxes', 'hidden_settings'], function() { 
        Ext.each(track[this], function() {
            str += ',' + this.name + ':' + (this.hasOwnProperty('curr_value') ? this.curr_value : this.value);
        });
    });
    return str;
}

SeqView.TM.tracksArrayToString = function(tracks, shown, order, extraOpt){
    var str = '';
    if (typeof extraOpt != 'string') extraOpt = '';
    Ext.each(tracks, function(track) {
        str += '[' + SeqView.TM.trackToString(track);
        if (shown) str += ',shown:' + (track.shown ? 'true' : 'false');
        if (order) str += ',order:' + track.order;
        str += extraOpt + ']';
    });
    return str;
}

// returns an array of strings for parallel rendering
SeqView.TM.tracksToArrayOfStrings = function(tracks, extraOpt){
    if (!tracks.length) return [];
    var newGroup = curGroup = -1;
    var trx = [''];
    
    for (var i = 0; i < tracks.length; i++) {
        if (!tracks[i].shown) continue;
        if (curGroup != tracks[i].render_group) {
            curGroup = tracks[i].render_group;
            if (++newGroup) trx[newGroup] = '[key:no ruler]'; 
        }
        var trk = tracks[i];
        trk.rg = newGroup;
        trx[newGroup] += '[' + SeqView.TM.trackToString(trk) + extraOpt + ']';
        if (trk.key == 'graph_overlay' && trk.subTracks) {
            trk.subTracks.forEach(function(uId, idx){
                if (uId.substr(-7) == '_hidden') return;
                for (var j = 0; j < tracks.length; j++) {
                    if (tracks[j].id != trk.legend[idx].id) continue;
                    if (trk.render_group != tracks[j].render_group || !tracks[j].shown)
                        trx[newGroup] += '[' + SeqView.TM.trackToString(tracks[j])+ ', shown:false' + extraOpt + ']';
                    break;
                }
            });
        }
    }
    if (SeqView.TM.renderStat) {
        tracks.forEach(function(t) {
            console.log(t.display_name + ', render_group: ' + t.render_group + ', rg# ' + t.rg + ', order: ' + t.order);
        });
    }
    if (trx.length == 1) return trx[0]; // return string if our array has only one value
    return trx;
}


SeqView.TM.generateTracksString = function(categories){
    categories = categories || SeqView.TM.categories;
    if (!categories) return null;

    var act_tracks = SeqView.TM.collectActiveTracks(categories);
    return SeqView.TM.tracksArrayToString(act_tracks, true);
}


SeqView.TM.generateTracksStringForConfig = function(categories, filter_shown) {
    categories = categories || SeqView.TM.categories;
    if (!categories) return null;

    var str = '';
    Ext.each(categories, function(cat) {
        Ext.each(cat.subcategories, function(subcat) {
            Ext.each(subcat.tracks, function(track) {
                if (track.shown || !filter_shown) {
                    str += '[';
                    str += SeqView.TM.trackToString( track );
                    str += ',order:' + track.order;
                    str += ',shown:' + (track.shown ? 'true' : 'false');
                    str += ']';
                }
            });
        });
    });
    return str;
}


SeqView.TM.applyGroupSettings = function(categories, group_track) {
    Ext.each(categories, function(cat) {
        Ext.each(cat.subcategories, function(subcat) {
            Ext.each(subcat.tracks, function(track) {
                if (track.key === group_track.key &&
                    track.setting_group === group_track.setting_group) {
                    track.check_boxes = group_track.check_boxes;
                    track.choice_list = group_track.choice_list;
                    if (group_track.text_boxes) track.text_boxes = group_track.text_boxes;
                }
            });
        });
    });
}

////////////////////////////////////////////////////////////////////////////////////////////////
//
SeqView.TM.getGroupSettingsString = function(group_track) {
    var str = '';
    if (group_track) {
        str += '[';
        str += SeqView.TM.trackToString(group_track, true);
        str += ']';
    }
    return str;
}

////////////////////////////////////////////////////////////////////////////////////////////////
//
SeqView.TM.Common = {
    updateSeqViewApp: function(categories, app, group_track) {
        var group_settings;
        app = app || this.sviewApp;
        var user_data = app.m_Key;
        if (this.getEl) this.getEl().mask('Configuring...', 'x-mask-loading');
        var seqConfig = this.seqConfig || app.m_Config;
        categories = categories || SeqView.TM.processTracksInfo(seqConfig.TrackConfig);
        group_track = group_track || this.group_track || null;
        if (group_track) {
            SeqView.TM.applyGroupSettings(categories, group_track);
            group_settings = SeqView.TM.getGroupSettingsString(group_track);
        }
        seqConfig.save({
            tracks: (typeof categories == 'string') ? categories : SeqView.TM.generateTracksStringForConfig(categories),
            group_settings: group_settings,
            callback: {
                success: function(res) {
                    if (!user_data || user_data.length == 0) user_data = null;
                    var tracks = SeqView.TM.generateTracksString(categories);
                    if (!tracks || tracks.length == 0) tracks = null;
                    if (this.cfgClean) this.cfgClean();
                    app.updateConfig(seqConfig, user_data, tracks);
                },
                failure: function(res) {
                    var fromcgi = Ext.decode((typeof res === 'object') ? res.responseText : res);
                    var msg = fromcgi.success === false ? fromcgi.msg : res.responseText;

                    Ext.MessageBox.show({title: 'Configuration saving error',msg: msg,
                                 buttons: Ext.MessageBox.OK,icon:Ext.MessageBox.ERROR});
                    if (this.cfgClean) this.cfgClean();
                },
                scope: this
            }
        });
    },

    createMainPanel: function(categories) {
        this.categories = categories;
        this.tracksPanel = new SeqView.TM.MainPanel({
            sviewApp: this.sviewApp,
            categories: this.categories
        });

        this.uploadPanel = new SeqView.TM.UploadPanel({
            cfgPanel: this,
            dirty: false

        });

        var activeTab = this.activeTab || 0;
        var panel = new Ext.TabPanel({
            activeTab: activeTab,
            items: [this.tracksPanel, this.uploadPanel],
            listeners: {
                beforetabchange: function(p, newtab, curtab) {
                    if (newtab === this.tracksPanel) {
                        if (newtab.dirty) {
                            // Save unchecked tracks ???
                            this._loadTracks(false);
                            // Restore unchecked tracks ???
                        }
                    }
                },
                scope: this
            },
            buttons: [
                {text: 'Configure Group', scope: this,
                 hidden: true, id: 'sv-config_group_button',
                 handler: function(b) {
                    if (this.cfgWindow) {
                        if (this.sviewApp) this.group_track = b.track;
                        this.reConfigure(false);
                    }
                }},
                {text: 'Configure', id: 'sv-configure_button_id', scope: this, handler: function(b) {
                    this.sviewApp.cfgEvent = true;
                    if (!this.uploadPanel.uploadButt.disabled) {
                        var msgBox = Ext.MessageBox.show({title:'External Data Upload',
                            msg: 'Upload external data?',
                            buttons:Ext.MessageBox.YESNO,
                            icon:Ext.MessageBox.QUESTION,
                            fn: function(buttonId) {
                                this.reConfigure(buttonId == 'yes');
                                delete msgBox;
                            },
                            scope: this
                        });
                    }
                    else this.reConfigure(false);
                }},
                {text: 'Load Defaults', scope: this, handler: function(b) {
                    this._loadTracks(true);
                }},
                {text: 'Cancel', scope: this, handler: function() {
                    this.uploadPanel.JobInProgress = false;
                    if (this.cfgClean()) return;
                    this.seqConfig.TrackConfig = Ext.ux.clone(this.sviewApp.m_Config.TrackConfig)
                    this.seqConfig.Options = Ext.ux.clone(this.sviewApp.m_Config.Options);
                    this.categories = SeqView.TM.processTracksInfo(this.seqConfig.TrackConfig);
                    this.tracksPanel.reload(this.categories);
                }}
            ],
            getActTracksPanel: function() {
                return this.items.items[0].items.items[0].items.items[0];
            }
        });
        return panel;
    },

    // private
    _loadTracks: function(default_cfg) {
        this.getEl().mask('Loading...', 'x-mask-loading');
        if (default_cfg)
            this.sviewApp.m_Key = this.sviewApp.defaultConfig.m_Key;
        this.seqConfig.load({
            defaultcfg: default_cfg,
            user_data: this.sviewApp.m_Key,
            callback: {
                success: function(config) {
                    this.categories = SeqView.TM.processTracksInfo(config.TrackConfig);
                    this.tracksPanel.reload(this.categories);
                    this.getEl().unmask();
                },
                failure: function(res) {
                    var fromcgi = Ext.decode((typeof res === 'object') ? res.responseText : res);
                    var msg = fromcgi.success === false ? fromcgi.msg : res.responseText;

                    Ext.MessageBox.show({title: 'Configuration loading error',msg: msg,
                                         buttons: Ext.MessageBox.OK,icon:Ext.MessageBox.ERROR});
                    this.getEl().unmask();
                },
                scope: this
            },
            forcereload: true
        });
    }
}

SeqView.TM.ShowConfigDialog = function(sview_app, activeTab, row2select) {
    sview_app.resizeIFrame(600);
    var seqconfig = new SeqView.Config(sview_app);
    seqconfig.TrackConfig = Ext.ux.clone(sview_app.m_Config.TrackConfig);
    seqconfig.Options = Ext.ux.clone(sview_app.m_Config.Options);
    var tm = new Ext.Window({
        title: 'Configure Page',
        modal: true,
        layout:'fit',
        width:750,
        height:550,
        plain: true,
        cls: 'SeqViewerApp'
    });
    var cfgPanel = new SeqView.TM.ConfigPanel({
       cfgWindow: tm,
       accession: sview_app.m_Config.SeqInfo.id,
       seqConfig: seqconfig,
       sviewApp: sview_app,
       activeTab: activeTab || 0
    });
    tm.add(cfgPanel);
    if (row2select) {
        SeqView.TM.TrackSelection(cfgPanel.tracksPanel.actTracksTab, row2select);
    }

    tm.on('close', function(p) {
        if (p.cancelAction)
            SeqView.App.simpleAjaxRequest({url: p.cancelAction});
        sview_app.resizeIFrame();
        sview_app.m_DialogShown = false;
        sview_app.fireEvent('configuration_panel', sview_app, sview_app.cfgEvent ?  'close' : 'cancel');
        delete sview_app.cfgEvent;
    });
    sview_app.fireEvent('configuration_panel', sview_app, 'open');
    sview_app.m_DialogShown = true;
    if (sview_app.m_iFrame) tm.show.defer(500, tm); else tm.show();
};


SeqView.TM.modifyTrackDetails = function(gview, track) {
    var app = gview.m_App;
    app.resizeIFrame(600);
    var tsWindow = new Ext.Window({
        title: track.display_name,
        modal: true,
        width:550,
        cls: 'SeqViewerApp'
    });
    
    var applySettings = function(button) {
        SeqView.TM.Common.updateSeqViewApp(null, app, button.group_tracks);
        tsWindow.close();
    }

    var detailPanel = new SeqView.TM.TrackDetail({
        region: 'north',
        height: 250,
        minSize: 100
    });
    tsWindow.add(detailPanel);
    var gname = track.setting_group;
    if (gname) {
        var display_limit = 10;
        if (gname.length > display_limit) gname = group.substr(0, display_limit) + "...";
    }
    var panel = tsWindow.add({buttons: [
        {text: "Apply to Group \'" + gname + "'", scope: this, handler: applySettings,
         hidden: !(gname), group_track: track},
        {text: 'Apply',  scope: this, handler: applySettings},
        {text: 'Cancel', scope: this, handler: function() {tsWindow.close();}}]});

    SeqView.TM.updateTrackDetails(detailPanel, track);
    tsWindow.on('show', function(){
        var tr = panel.el.dom.getElementsByClassName('x-toolbar-left-row')[0];
        var idTL = 'svtt_Legend_' + Ext.id();
        tr.innerHTML = '<div id=' + idTL + ' style="color:blue; text-decoration: underline; cursor: pointer;">Track legend</div>';
        var linkEl = Ext.get(idTL);
        linkEl.on('click',function() {
            SeqView.pingClick('8-2');
            SeqView.showHelpDlg('legends/#' + track.legend_text);
        });
    }
    );
    tsWindow.on('close', function() {
        app.resizeIFrame();
    });
    if (app.m_iFrame) tsWindow.show.defer(500, tsWindow); else tsWindow.show();
};


SeqView.TM.ConfigPanel = Ext.extend(Ext.Panel, {
    initComponent : function(){
        var categories = SeqView.TM.processTracksInfo(this.seqConfig.TrackConfig);
        Ext.apply(this, {
            border: false,
            height:  515,
            layout: 'fit',
            items: this.createMainPanel(categories)
        });
        SeqView.TM.ConfigPanel.superclass.initComponent.call(this);
    },
    cfgClean: function() {
        if (this.getEl().isMasked()) this.getEl().unmask();
        if (!this.cfgWindow) return false;
        this.cfgWindow.close();
        return true;
    },
    reConfigure: function(checkDirty) {
        if (this.sviewApp) {
            if (checkDirty && !this.uploadPanel.uploadButt.disabled) {
                this.uploadPanel.submitForm(null, this.cfgProcess, this);
            } else {
                this.cfgProcess();
            }
        } else {
            this.cfgClean();
        }
    },
    cfgProcess: function() {
        var user_data = this.sviewApp.m_Key;
        if (this.tracksPanel.dirty) {
            this.getEl().mask('Loading...', 'x-mask-loading');
            this.seqConfig.load({
                user_data: user_data,
                callback: {
                    success: function(config) {
                        var categories = SeqView.TM.processTracksInfo(config.TrackConfig);
                        this.updateSeqViewApp(categories);
                    },
                    failure: function(res) {
                    var fromcgi = Ext.decode((typeof res === 'object') ? res.responseText : res);
                        var msg = fromcgi.success === false ? fromcgi.msg : res.responseText;
                        delete this.sviewApp.cfgEvent;
                        Ext.MessageBox.show({title: 'Configuration loading error',msg: msg,
                                           buttons: Ext.MessageBox.OK,icon:Ext.MessageBox.ERROR});
                    },
                    scope: this
                },
                forcereload: true
            });
        } else {
            if (this.tracksPanel.items.items[0].activeTab.gridPanel.syncModifiedTracks()
               && this.tracksPanel.items.items[0].activeTab.searchTracks) {
                // if the active is Search Tracks tab and there were changes it overwrites changes made in other tabs
                var tcfg = this.tracksPanel.sviewApp.m_Config.TrackConfig;
                this.categories = SeqView.TM.processTracksInfo(tcfg);
                this.seqConfig.TrackConfig = Ext.ux.clone(tcfg);
            }
            this.updateSeqViewApp(this.categories);
            if (this.sviewApp.m_PermConfId) this.tracksPanel.reload(this.categories);
        }
    }
});

Ext.apply(SeqView.TM.ConfigPanel.prototype, SeqView.TM.Common);

SeqView.TM.ShowConfigPanel = function(sview_app, activeTab) {
    var seqconfig = new SeqView.Config(sview_app);
    seqconfig.TrackConfig = Ext.ux.clone(sview_app.m_Config.TrackConfig);
    seqconfig.Options = Ext.ux.clone(sview_app.m_Config.Options);
    var confpanel = new SeqView.TM.ConfigPanel({
        accession: sview_app.m_Config.SeqInfo.id,
        seqConfig: seqconfig,
        sviewApp: sview_app
    });
    var tm = new Ext.Panel({
        title: 'Configure Page',
        layout: 'fit',
        border: false,
        renderTo: sview_app.m_PermConfId,
        items: confpanel
    });

    var el = Ext.get( sview_app.m_PermConfId );
    if( el ){
        el.set({ 'confpanel_id': confpanel.id });
    }
    tm.show();
};

SeqView.TM.ConfigTrackSelection = function(sview_app, index) {
    var cfgPanel;
    var confdiv = Ext.get(sview_app.m_PermConfId);
    if (confdiv) {
        var confpanel_id = confdiv.getAttribute('confpanel_id');
        if (confpanel_id) cfgPanel = Ext.getCmp(confpanel_id);
    }
    if (cfgPanel) {
        confdiv.dom.scrollIntoView(false);
        cfgPanel.items.items[0].setActiveTab(cfgPanel.tracksPanel);
        cfgPanel.tracksPanel.items.items[0].setActiveTab(0);
        SeqView.TM.TrackSelection(cfgPanel.tracksPanel.actTracksTab, index);
    } else {
        SeqView.TM.ShowConfigDialog(sview_app, 0, index);
    }
}

SeqView.TM.TrackSelection = function(actTracksTab, row2select) {

    (function() {
        actTracksTab.gridPanel.getSelectionModel().selectRow(row2select,false,false);
        var el = actTracksTab.detailPanel.el;
        var subEl = el.select('div[class="x-panel-body"]',el);
        // aplies color animation to div
        subEl.animate(
            {backgroundColor: {from: '#F0F0F0', to: '#CFECEC'}},
            0.5,       // animation duration
            null,      // callback
            'easeOut', // easing method
            'color'    // animation type ('run','color','motion','scroll')
        );

        // builds rectangle to apply border outline color
        var rect = new Ext.Element(document.createElement('div'));
        Ext.getBody().appendChild(rect);
        rect.setXY(el.getXY());
        rect.setWidth(el.getRight() - el.getLeft());
        rect.setHeight(el.getBottom() - el.getTop());
        rect.applyStyles('z-index:20000;outline-style: solid ;outline-color: red; outline-width: thin;');
        var task = new Ext.util.DelayedTask(function(){
            if (rect && rect.dom) Ext.removeNode(rect.dom);
            subEl.animate(
                {backgroundColor: {from: '#CFECEC', to: '#F0F0F0'}},
                1.0,      // animation duration
                null,      // callback
                'easeOut', // easing method
                'color'    // animation type ('run','color','motion','scroll')
            );
        });
        task.delay(1000);
    }).defer(200,this);
}

SeqView.TM.modifyLegendSettings = function(gview, track, idx) {
    var app = gview.m_App;
    var legends = track.legends;
    if (!legends[0].name)
        Ext.each(legends, function() {
            var split = this.label.split(': ');
            if (split.length > 2) split[1] = this.label.substr(split[0].length + 2);
            this.gStyle = split[0];
            this.name = split[1];
            this.hidden = !this.bounds;
        });
    app.resizeIFrame(300);
    var lgWindow = new Ext.Window({
        title: track.display_name,
        modal: true,
        width:550,
        cls: 'SeqViewerApp'
    });
    lgWindow.on('close', function() { app.resizeIFrame(); });
    
    var applySettings = function(button) {
        var doReload = false;
        var trackConfig = app.m_Config.TrackConfig;
        var subTracks = [];
        Ext.each(track.legends, function(lg) {
            if (!lg.bounds !== lg.hidden) {
                doReload = true;
                delete lg.bounds;
            }
            subTracks.push(trackConfig[lg.idx].uId + (lg.hidden ? '_hidden' : ''));
            Ext.each(trackConfig[lg.idx].hidden_settings, function() {
                if (lg[this.name] != this.value) {
                    doReload = true;
                    this.value = lg[this.name];
                }
            });
            if (lg.label.split(': ')[0] != lg.gStyle) {
                doReload = true;
                Ext.each(trackConfig[lg.idx].choice_list, function() {
                    if (this.name != 'style') return true;
                    this.curr_value = lg.gStyle;
                    return false;
                });
            }
        });
        if (doReload) {
            trackConfig[track.idx].subTracks = subTracks;
            SeqView.TM.Common.updateSeqViewApp(null, app);
        }
        lgWindow.close();
    }

    var trackStore = [];
    Ext.each(legends, function() { trackStore.push(this.name); });
    var trackPicker = new Ext.form.ComboBox({ triggerAction: 'all', width: 530, name: 'trackPicker', mode:'local',
                       store: trackStore, allowBlank: false, editable: false, value: legends[idx].name});
    trackPicker.on('select', function(o, oo, sIdx) {
        if (idx == sIdx) return;
        idx = sIdx;
        updateSettings();

    });
    
    lgWindow.add(trackPicker);
    
    var settingsPanel =  new Ext.Panel({
        bodyStyle: { background: '#F0F0F0', padding: '5px', 'overflow-y': 'auto', 'overflow-x': 'hidden' },
        layout: 'form', labelWidth: 70,  labelAlign:'right', region: 'north', height: 120
    });
    lgWindow.add(settingsPanel);
   
    var colorPickerId = Ext.id();
    var colorPicker = {xtype: 'container', layout: 'hbox', fieldLabel: 'Color', padding: 20,
            items: [
                { xtype: 'panel', html: '<div id="' + colorPickerId + '" style="width:40px; height:22px;'
                    + '">&nbsp;&nbsp;</div>'},
                { xtype:'button',
                    menu: { xtype: 'colormenu',
                        handler: function(picker, choice) {
                            legends[idx].color = '#' + choice;
                            Ext.get(colorPickerId).applyStyles('background-color: ' + legends[idx].color + ';');
                        }
                    }
                }]
        };
        
    var opacitySlider = {xtype: 'container', layout: 'hbox', fieldLabel: 'Opacity', padding: 20,
        items:[
            new Ext.Slider({
            name: 'Opacity', width: 100,
            minValue: 0, maxValue: 100,  increment: 5,
            listeners: { changecomplete:
                function(el, val, thumb) {
                    legends[idx].opacity = val;
                    if (!el.plugins.slide) {
                        el.plugins.onSlide(el, null, thumb);
                        Ext.defer(function () {this.hide(); this.slide}, 500, el.plugins);
                    }
                    else el.plugins.slide = false;
                }
            },
            plugins: new Ext.slider.Tip({
                getText: function(thumb){
                    this.slided = true;
                    Ext.get(colorPickerId).applyStyles('opacity: ' + (thumb.value/100) + ';');
                    return String.format('<b>{0}%</b>', thumb.value);
                }
            })
         })]};

    var stylePicker = new Ext.form.RadioGroup({fieldLabel: 'Graph style', columns: 1,
            items: [
                {boxLabel: 'Histogram', name: 'sv_graph_style', inputValue: 'histogram'},
                {boxLabel: 'Line graph', name: 'sv_graph_style', inputValue: 'line graph'}
            ]
        });
    stylePicker.on('change', function(sp, rButt) { legends[idx].gStyle = rButt.inputValue; });
    
    var trackHider = new Ext.form.Checkbox({ boxLabel: 'Hide track', fieldLabel: 'Hide track', checked: legends[idx].hidden });
    trackHider.on('check', function(o, checked) {
        legends[idx].hidden = checked;
        if (checked) settingsPanel.disable();
        else settingsPanel.enable();
    });
    lgWindow.add(trackHider);

    function updateSettings() {
        var legend = legends[idx];
        Ext.get(colorPickerId).applyStyles('background-color:' + legend.color + ';opacity:' + (legend.opacity/100) + ';');
        opacitySlider.items[0].setValue(parseInt(legend.opacity));
        Ext.each(stylePicker.items.items, function() { this.setValue(this.inputValue == legend.gStyle); });
        trackHider.setValue(legend.hidden);
    }
         
    settingsPanel.add(colorPicker);
    settingsPanel.add(opacitySlider);
    settingsPanel.add(stylePicker);
    lgWindow.on('show', function(){ updateSettings(); });

    lgWindow.add({buttons: [
        {text: 'Apply',  scope: this, handler: applySettings},
        {text: 'Cancel', scope: this, handler: function() {lgWindow.close();}}]});

    if (app.m_iFrame) lgWindow.show.defer(500, lgWindow); else lgWindow.show();
};


/*  $Id: tm_grids.js 32357 2015-02-11 21:29:22Z borodine $
*/
Ext.namespace('SeqView.TM');

/////////////////////////////////////////////////////////////////////////
///
SeqView.TM.GridToolTip = Ext.extend(Ext.ToolTip, {
    cls: 'SeqViewerApp',
    onTargetOver: function(e) {
        this.baseTarget = e.getTarget();
        SeqView.TM.GridToolTip.superclass.onTargetOver.call(this,e);
    },
    onMouseMove: function(e) {
        if (!e.within(this.baseTarget)) {
            this.onTargetOver(e);
            return false;
        }
        SeqView.TM.GridToolTip.superclass.onMouseMove.call(this,e);   
    }
});

SeqView.TM.GridBase = Ext.extend(Ext.grid.GridPanel, {
    initComponent : function(){
        if (!this.colModel) {
            var columns = [{xtype: 'checkcolumn', header: 'Active', sortable: false, dataIndex: 'shown', width: 10},
                    {id:'name', header: "Name", dataIndex: "display_name", sortable: false, editable: false, width: 600}];
            if (this.groupGrid) columns.push({id:'subcat', header: "Category", dataIndex: "subcat", sortable: false});
            delete this.group_columns
            Ext.apply(this, {
                hideHeaders: true,
                border: false,
                enableHdMenu: false,  
                enableColumnMove: false,
                //autoHeight: true,
                colModel: new Ext.grid.ColumnModel(columns),
                selModel:  new Ext.grid.RowSelectionModel()
            });
        }
        SeqView.TM.GridBase.superclass.initComponent.call(this);
    },
    reloadTracks: function(tracks) {
        //console.log(rdata);
        if (tracks) this.tracks = tracks;
        var sm = this.getSelectionModel();
        var srec = sm.getSelected();
        var srow = srec? this.getStore().indexOf(srec) : null;
        this.getStore().loadData(this.tracks);
        if (srow !== null) {
            sm.selectRow(srow);
        }
    },
    syncModifiedTracks: function(tracks_config) {
        var mr = this.getStore().getModifiedRecords();
        for (var i = 0; i < mr.length; i++) {
            var data = mr[i].data;
            var checkNsync = function(tr) {
                if (tr.uuid == data.uuid) { tr.shown = data.shown; return false; }
            }
            if (tracks_config) Ext.each(tracks_config, checkNsync);
            Ext.each(this.tracks, checkNsync);
        }

/*        mr.forEach(function(mt) {
            var uuid = mt.data.uuid;
            var checkNsync = function(tr) {
                if (tr.uuid == uuid) { tr.shown = mt.data.shown; return false; }
            }
            if (tracks_config) Ext.each(tracks_config, checkNsync);
            Ext.each(this.tracks, checkNsync);
        }, this);*/
        return mr.length;
    },
    onRender: function() {
        SeqView.TM.GridBase.superclass.onRender.apply(this, arguments);
        this.tooltip = new SeqView.TM.GridToolTip({
            hideDelay: Ext.isIE ? 1500 : 1000,
            mouseOffset: Ext.isIE ? [-15,-15] : [0,0],
            renderTo: Ext.getBody(),
            target: this.view.mainBody,
            listeners: {
                beforeshow: function(qt) {
                    if (this.inDragNDrop) {
                        this.tooltip.hide();
                        return false;
                    }
                    var v = this.getView();
                    var row = v.findRowIndex(qt.baseTarget);
                    var cell = v.findCellIndex(qt.baseTarget);
                    if (row !== false && cell !== false && (cell === 0 || cell === 1)) {
                        var r = this.getStore().getAt(row);
                        var help = r.data.help ? r.data.help : "";
                        if (r.data.legend_text) {
                            var tt = this.tooltip;
                            var lText = '<a href=\"' + SeqView.getHelpURL() + 'legends/#' + r.data.legend_text + 
                                        '\" target=\"_blank\" style=\"color:blue\">Track legend</a>';
                            tt.body.update(lText + '<div>' + help + '</div>');
                        } else {
                            this.tooltip.body.update(help);
                        }
                    } else {
                        this.tooltip.hide();
                        return false;
                    }
                },
                scope: this
            }
        });
    }

});


/////////////////////////////////////////////////////////////////////////////
///
SeqView.TM.Grid = Ext.extend(SeqView.TM.GridBase, {
    initComponent : function(){       
        Ext.apply(this, {
            store: new Ext.data.JsonStore({
                fields: ['uuid', 'shown', 'name', 'display_name', 'key', 'subkey',
                         'annots', 'choice_list', 'check_boxes', 'help', 'legend_text',
                         'setting_group', 'text_boxes'
                        ],
                data: this.tracks
            }),
            viewConfig: {
                scrollOffset: 2,
                forceFit: true
                //autoFill: true
            }
        });
        SeqView.TM.Grid.superclass.initComponent.call(this);
    }
});


/////////////////////////////////////////////////////////////////////////////
///
SeqView.TM.GroupGrid = Ext.extend(SeqView.TM.GridBase, {
    initComponent : function(){       
        var tracks = [];
        Ext.each(this.subcategories, function(subcat) {
            Ext.each(subcat.tracks, function(track) {
                track.subcat = subcat.display_name;
                tracks.push(track);
            })
        });
        this.tracks = tracks;
        var reader = new Ext.data.JsonReader({
            fields: ['uuid', 'shown', 'name', 'display_name', 'key', 'subkey',
                     'annots', 'choice_list', 'check_boxes', 'help', 'legend_text', 'subcat',
                     'setting_group', 'text_boxes']
        });
        var store = new Ext.data.GroupingStore({
            reader: reader,
            data: this.tracks,
            sortInfo:{field: 'subcat', direction: "ASC"},
            groupField:'subcat'
        });

        Ext.apply(this, {
            store: store,
            groupGrid: true,
            view: new Ext.grid.GroupingView({
                scrollOffset: 2,
                forceFit: true,
                hideGroupedColumn: true,
                groupTextTpl: '{text} ({[values.rs.length]} {[values.rs.length > 1 ? "Items" : "Item"]})'
            })
        });
        SeqView.TM.GroupGrid.superclass.initComponent.call(this);
    }
});

/////////////////////////////////////////////////////////////////////////////
///
SeqView.TM.ActiveTracksGrid = Ext.extend(SeqView.TM.Grid, {
    initComponent: function() {
        SeqView.TM.ActiveTracksGrid.superclass.initComponent.call(this);
        var grid_dd = new Ext.ux.dd.GridDragDropRowOrder({
            scrollable: true, // enable scrolling support (default is false)
            targetCfg: {},
            listeners: {
                beforerowmove: function(objThis, oldIndex, newIndex, records) {},
                afterrowmove: function(objThis, oldIndex, newIndex, records) {
                    var tracks = objThis.grid.tracks;
                    var records = objThis.grid.getStore().data;
                    var order = 0;
                    records.each(function(r) {
                        Ext.each(tracks, function(t) {
                            if (t.uuid == r.data.uuid) {
                                t.order = order++;
                                return false;
                            }
                        });
                    })
                },
                startDrag: function(objThis) {
                    objThis.grid.inDragNDrop = true;
                },
                endDrag: function(objThis) {
                    delete objThis.grid.inDragNDrop;
                }
            }
        });
        this.plugins = [grid_dd];
    }
});
/*  $Id: sviewapp.js 34159 2015-11-13 21:29:02Z borodine $
 * ===========================================================================
 *
 *                            PUBLIC DOMAIN NOTICE
 *               National Center for Biotechnology Information
 *
 *  This software/database is a "United States Government Work" under the
 *  terms of the United States Copyright Act.  It was written as part of
 *  the author's official duties as a United States Government employee and
 *  thus cannot be copyrighted.  This software/database is freely available
 *  to the public for use. The National Library of Medicine and the U.S.
 *  Government have not placed any restriction on its use or reproduction.
 *
 *  Although all reasonable efforts have been taken to ensure the accuracy
 *  and reliability of the software and data, the NLM and the U.S.
 *  Government do not and cannot warrant the performance or results that
 *  may be obtained by using this software or data. The NLM and the U.S.
 *  Government disclaim all warranties, express or implied, including
 *  warranties of performance, merchantability or fitness for any particular
 *  purpose.
 *
 *  Please cite the author in any work or product based on this material.
 *
 * ===========================================================================
 *
 * Authors:  Vlad Lebedev, Maxim Didenko, Victor Joukov
 *
 * File Description:
 *
 */

SeqView.fireEvent = function(eName, elemID){
    var elem = document.getElementById(elemID);
    if (document.createEvent) {
        var e = document.createEvent('HTMLEvents');
        e.initEvent(eName, false, false);
        elem.dispatchEvent(e);
    } else elem.fireEvent(eName);
};


/********************************************************************/
//////////////////////////////////////////////////////////////////////
// SeqView.Config
/********************************************************************/

SeqView.Config = (function() {

    function constructor(app) {
        this.m_App = app;
    }

    return constructor;

}) ();

SeqView.Config.prototype = {
    save: function(cfg) {
        var succ_fn = cfg && cfg.callback && cfg.callback.success ? cfg.callback.success : function(seqconfig) {};
        var fail_fn = cfg && cfg.callback && cfg.callback.failure ? cfg.callback.failure : function() {};
        var scope = cfg && cfg.callback && cfg.callback.scope ? cfg.callback.scope : this;

        var url = cfg.config_url || this.m_App.m_CGIs.Config;
        var cookie_name = SeqView.Cookies.UserTracksCookieName;
        if (this.m_App.m_AppName && this.m_App.m_AppName.length > 0 && cookie_name === SeqView.Cookies.UserTracksCookieNameBase) {
            cookie_name += '-' + this.m_App.m_AppName;
        }
        var user_config_key = cfg.user_config_key || SeqView.UserTracks.get( cookie_name, null );
        if (!cfg.tracks) {
            succ_fn.call(scope, this); // nothing to save - just call success function and exit
            return;
        }
        var params = {saveconfig: true, tracks: cfg.tracks, userconfigkey: user_config_key};
        if (cfg.group_settings) {
            params.group_settings = cfg.group_settings;
        }
        Ext.apply(params, this.visualOptionsUrl());

        var req_num = this.m_App.m_ReqNum || 0;
        this.m_App.m_ReqNum = ++req_num;

        this.m_App.m_timeStamps = {prior2seqconfig: new Date().getTime()};

        this.m_App.AjaxRequest({url:url, context: this, data: params,
            success: function(data, text, res) {
                if (this.m_App.m_ReqNum > req_num) return;
                var from_cgi = SeqView.decode(data);
                if (from_cgi.success === false) {
                    fail_fn.apply(scope, arguments);
                } else {
                    if (!cfg.user_config_key)
                        SeqView.UserTracks.set(cookie_name, from_cgi.userconfigkey);
                    else
                        this.userconfigkey = from_cgi.userconfigkey;
                    succ_fn.call(scope, this);
                }
            },
            error: function(data, text, res) {
                if (this.m_App.m_ReqNum > req_num) return;
                fail_fn.apply(scope, arguments);
            }
        });

    },

    load: function(cfg) {

        var succ_fn = cfg && cfg.callback && cfg.callback.success ? cfg.callback.success : function(seqconfig) {};
        var fail_fn = cfg && cfg.callback && cfg.callback.failure ? cfg.callback.failure : function() {};
        var scope = cfg && cfg.callback && cfg.callback.scope ? cfg.callback.scope : this;

        var url = cfg.config_url || this.m_App.m_CGIs.Config;
        var seqid = cfg && cfg.seqid ? cfg.seqid : this.m_App.GI;

        var params = { id: seqid };

        // Save initial parameters for Load Defaults, or restore them from saved
        // All other relevant parameters seem to be untouched
        if (cfg && cfg.defaultcfg) {
            // Restore
            this.m_App.m_TracksFromURL = this.m_App.defaultConfig.m_TracksFromURL;
            this.m_App.m_ViewContent   = this.m_App.defaultConfig.m_ViewContent;
            if (this.m_App.defaultConfig.uploadedIDs)
                this.m_App.uploadedIDs = this.m_App.defaultConfig.uploadedIDs.slice(0);
        } else {
            // Save
            if (!this.m_App.defaultConfig) {
                this.m_App.defaultConfig = {
                    'm_TracksFromURL' : this.m_App.m_TracksFromURL,
                    'm_ViewContent' : this.m_App.m_ViewContent
                };
                if (this.m_App.uploadedIDs)
                    this.m_App.defaultConfig.uploadedIDs = this.m_App.uploadedIDs.slice(0);
                if (this.m_App.m_Key)
                    this.m_App.defaultConfig.m_Key = this.m_App.m_Key;
            }
        }

        Ext.each(
            [
                ['m_TracksFromURL', 'tracks']
                ,['m_ViewTheme', 'theme']
                ,['m_ViewContent','content']
                ,['m_ItemID', 'itemID']
                ,['m_AppContext', 'app_context']
                ,['m_AssmContext', 'assm_context']
                ,['m_SRZ', 'srz']
                ,['m_BamPath', 'bam_path']
                ,['m_DepthLimit', 'depthlimit']
            ],
            function( pair ) {
                if( this.m_App[pair[0]] ){
                    params[pair[1]] = this.m_App[pair[0]];
                }
            },
            this
        );

        if (cfg && (cfg.resettracks || (cfg.defaultcfg && !this.m_App.m_TracksFromURL))) {
            delete params.tracks;
            var cookie_name = SeqView.Cookies.UserTracksCookieName;
            if (this.m_App.m_AppName && this.m_App.m_AppName.length > 0 && cookie_name === SeqView.Cookies.UserTracksCookieNameBase) {
                cookie_name += '-' + this.m_App.m_AppName;
            }
            params.clear = cookie_name;
        }
        else if (!params.tracks) {
            params.tracks = !this.TrackConfig ? '[amend]'
                            : SeqView.TM.generateTracksStringForConfig(SeqView.TM.processTracksInfo(this.TrackConfig), true);
        }
        if (this.m_App.uploadedIDs) {
            Ext.each(this.m_App.uploadedIDs, function(track) { 
                var id = track.id || track.GetTMSId();
                // test for id:id enclosed by combination of commas or square brackets
                // /(\[|,){1}id:123(\]|,){1}/
                var id_regex = new RegExp("(\\[|,){1}id:" + id + "(\\]|,){1}");
                if (id_regex.test(params.tracks)) // track with this id already exists
                    return;
                // any id parameters
                // (\[|,){1}id:\w+(\]|,){1}
                id_regex = /(\[|,){1}id:\w+(\]|,){1}/;
                
                var not_found = true;
                var name = track.GetName();
                var key = track.GetAttr('track_type');
                if (name !== "" && key !== "") {
                    name = 'annots:' + name;
                    key = 'key:' + key;
                    var tr = params.tracks.split(/\[(.*?)\]/).filter(Boolean);
                    for (var i = 0; i < tr.length; i++) {
                        if (id_regex.test(tr[i])) // track has TMS id already
                            continue;
                        var p = tr[i].split(',');
                        if (p.indexOf(name) != -1 && p.indexOf(key) != -1) {
                            tr[i] += ',id:' + id;
                            not_found = false;
                        }
                    }                
                }
                if (not_found)
                    params.tracks += '[id:' + id + ']';
                else {
                    params.tracks = '[' + tr.join('][') + ']';
                }
            });
            delete this.m_App.uploadedIDs;
        }
        // We only use content param from URL ones for the first load.
        // After that we will get it for m_Config.Options.curr_content
        delete this.m_App.m_ViewContent;
        // Same. Get track configuration from TrackConfig
        delete this.m_App.m_TracksFromURL;

        var viewer_context = cfg.viewer_context || this.m_App.m_ViewerContext;
        if( viewer_context ) params.viewer_context = viewer_context;

        if(this.TrackConfig && !cfg.forcereload ) params.notrackconfig = 1;

        if( this.m_App.m_AppName && this.m_App.m_AppName.length > 0 ){
            params.appname = this.m_App.m_AppName;
        }

        if( cfg.defaultcfg !== true ){
            Ext.apply( params, this.visualOptionsUrl() );

            var cookie_name = SeqView.Cookies.UserTracksCookieName;
            if (this.m_App.m_AppName && this.m_App.m_AppName.length > 0 && cookie_name === SeqView.Cookies.UserTracksCookieNameBase) {
                cookie_name += '-' + this.m_App.m_AppName;
            }

            var user_config_key = cfg.user_config_key || SeqView.UserTracks.get(cookie_name, null);
            if( user_config_key ) params.userconfigkey = user_config_key;
        } else {
            // we need to pass app specific data in case we have one (ISCA, A2A browsers);
            var app_data = SeqView.SessionData.get( SeqView.Cookies.AppDataCookieName, null );
            if( app_data ) params.key = app_data;

            if( this.Options && this.Options.curr_content ){
                params.content = this.Options.curr_content;
            }

            params.nocache = 1;
        }

        var user_data = cfg.user_data || this.m_App.m_Key;
        if (user_data) params.key = user_data;

        var req_num = this.m_App.m_ReqNum || 0;
        this.m_App.m_ReqNum = ++req_num;

        var parKey = params.key;
        var delay = 0;

        if (this.m_App.m_Panel.tmpPanelFlag)
            this.m_App.m_Panel.items.items[0].getEl().mask('Loading...', 'x-mask-loading');
        var options = {url: url, context: this, data: params};
        if (this.m_App.m_parallelRender) options.data.parallel_render = this.m_App.m_parallelRender;

        var checkJobStatus = function(data, text, res) {
            var cleanPanel = function(panel) {
                if (panel.tmpPanelFlag) {
                    delete panel.tmpPanelFlag;
                    panel.removeAll();
                }
            }
            if (this.m_App.m_ReqNum > req_num) return;
            var from_cgi = SeqView.decode(data);
            if (typeof from_cgi !== 'object') {
                cleanPanel(this.m_App.m_Panel);
                fail_fn.apply(scope, arguments);
                return;
            }
            if (from_cgi.job_status) {
                var st = from_cgi.job_status;
                if (st == 'submitted' || st == 'running' || st == 'pending') {
                    options.url = url + '?job_key=' + from_cgi.job_id;
                    SeqView.App.simpleAjaxRequest.defer(
                        Math.min(15000, Math.max(2000, 1000 * delay++)),
                        this, [options]);
                    return;
                 }
            }
            cleanPanel(this.m_App.m_Panel);
            this.m_App.watchdogStop();
            if (from_cgi.success === false || from_cgi.job_status == 'failed') {
                if (!this.m_App.m_NoDataCookie && parKey ){
                    var cookie_name = SeqView.Cookies.UserDataCookieName;
                    if (this.m_App.m_AppName && this.m_App.m_AppName.length > 0 && cookie_name === SeqView.Cookies.UserDataCookieNameBase) {
                        cookie_name += '-' + this.m_App.m_AppName;
                    }
                    SeqView.SessionData.set(cookie_name, parKey);
                }
                fail_fn.apply(scope, arguments);
            } else {
                if (this.SeqInfo) from_cgi.SeqInfo.links = this.SeqInfo.links; // Keeping links (if we have them already)
                Ext.apply(from_cgi.Options, window.JSON.parse(localStorage.getItem('NCBI/SV/Preferences')));
                Ext.apply(this, from_cgi);
                succ_fn.call(scope, this);
            }
        }
        this.m_App.m_timeStamps = {prior2seqconfig: new Date().getTime()};
        if (window.timeStamp) {
            SeqView.ping({'SV_start_to_seqconfig_time': this.m_App.m_timeStamps.prior2seqconfig - timeStamp,
                          'sv-event':'initialization'});
            delete timeStamp;
        }
        
        options.success = options.error = checkJobStatus;
        this.m_App.watchdogStart(url, '', params);
        this.m_App.AjaxRequest(options);
        if (this.SeqInfo && this.SeqInfo.links) return;
        if (this.m_App.m_Config.SeqInfo && this.m_App.m_Config.SeqInfo.links) {
            if (!this.SeqInfo) this.SeqInfo = {};
            this.SeqInfo.links = this.m_App.m_Config.SeqInfo.links;
            return;
        }
        this.m_App.AjaxRequest({url: this.m_App.m_CGIs.Link, context: this,
            data: {id: params.id, link_type: 'placement'},
            success: function(data, text, res){
                var from_cgi = SeqView.decode(data);
                if (from_cgi.length > 0){
                    if (!this.SeqInfo) this.SeqInfo = {};
                    this.SeqInfo.links = from_cgi;
                }
            }
        });

    },

    visualOptionsUrl: function() {
        var params = {};
        if (this.Options) {
            Ext.each(['label','color', 'decor', 'spacing', 'content'], function(p) {
                var pattr = 'curr_'+p;
                if (this.Options[pattr] && this.Options[pattr].length > 0)
                    params[p] = this.Options[pattr];
            },this);
        }
        return params;
    }
};

/********************************************************************/
//////////////////////////////////////////////////////////////////////
// SeqView.Api
/********************************************************************/
SeqView.Api = (function() {

    function constructor(app) {
        this.m_App = app;
    }

    return constructor;

}) ();

SeqView.Api.prototype = {
    getAllDisplayOptions: function() {
        return this.m_App.m_Config.DisplayOptions;
    },

    getTracks: function(all) {
        return this.m_App.getTrackObjects(all);
    },

    setTracks: function(tracks) {
    }
};

/********************************************************************/
//////////////////////////////////////////////////////////////////////
// SeqView.App
/********************************************************************/

SeqView.App = (function() {
    var sm_Apps = [];
    var sm_ResizeWatcher = null;
    var sm_NextAppIdx = 0;

    function Resizer(w, h) {
        for (var i = 0; i < sm_Apps.length; i++) {
            sm_Apps[i].doWindowResize(w, h);
        }
    };

    function onWindowResize(w, h) {
        var rw = w;
        var rh = h;
        if (sm_ResizeWatcher) {
            clearTimeout(sm_ResizeWatcher);
            sm_ResizeWatcher = null;
        }
        sm_ResizeWatcher = Resizer.defer(500,this,[rw,rh]);
    };
    Ext.EventManager.onWindowResize(onWindowResize);

    function constructor(div_id) {
        var rel = Ext.get(div_id);
        if (rel)
            rel.addClass("SeqViewerApp");
        else
            throw "A div element containing SeqViewer should have an id attribute";

        this.m_DivId = div_id;
        this.m_DivCtrlId = this.m_DivId + 'Controls';
        this.m_DivJSId = this.m_DivId + 'JS';
        this.m_DivTitle = this.m_DivId + 'Title';
        this.m_DivTitleID = this.m_DivId + 'TitleID';
        this.m_Views = [];
        this.m_Reflections = null;
        this.m_MarkersInfo = null;
        this.m_TextView = null;
        this.m_Idx = sm_NextAppIdx++;
        this.m_InitialLoading = false;
        this.m_DialogShown = false;

        this.constructor.initPings();

        if (Ext.isWindows && Ext.isGecko && !Ext.isIE
            && window.navigator && window.navigator.appVersion
            && window.navigator.appVersion.search('Trident') >= 0)
        {
            Ext.isIE = Ext.isIE11 = true;
        }
        SeqView.browser = Ext.isIE ? 'IE' : Ext.isOpera ? 'Opera' : Ext.isSafari ? 'Safari' : Ext.isGecko ? 'Firefox': Ext.isChrome ? 'Chrome' : 'Other';
        SeqView.browser_version = "n/a";
        if (SeqView.browser == "IE")
            SeqView.browser_version = Ext.isIE11 ? 'IE11' : Ext.isIE10 ? 'IE10' : Ext.isIE9 ? 'IE9' : Ext.isIE8 ? 'IE8' : Ext.isIE7 ? 'IE7' : Ext.isIE6 ? 'IE6' : 'Other';
        SeqView.os = Ext.isWindows ? 'Windows' : Ext.isMac ? 'Mac' : Ext.isLinux ? 'Linux' : 'Other';
        SeqView.ping({"sv-browser": SeqView.browser,
                      "sv-browser-version": SeqView.browser_version, "sv-os": SeqView.os});

        sm_Apps.push(this);
        this.addEvents({
            'panorama_image_loaded': true,
            'graphical_image_loaded': true,
            'marker_created': true,
            'marker_deleted': true,
            'feature_clicked': true,
            'beforeunload': true,
            'origin_changed': true,
            'strand_changed': true,
            'visible_range_changed': true,
            'ui_visible_range_changed': true,
            'api_visible_range_changed': true,
            'configuration_panel': true,
            'configuration_changed': true,
            'configuration_loaded': true,
            'selection_changed': true,
            'tracks_errors': true,
            'user_changed_selection': true
        });

    };

    constructor.initPings = function() {
        SeqView.ping = SeqView.pingClick = function(){};
        var args = [];
        SeqView.pingClick = function(area, svevent) {
            var obj = {jsevent: 'click', 'sv-area': area};
            if (svevent) obj['sv-event'] = svevent;
            SeqView.ping(obj);
        }
        SeqView.ping = function(a) { // saving pings while NCBI instrumented page is loading
            if (typeof ncbi !== 'undefined') {
                SeqView.ping = function(obj) { obj.ncbi_app = 'sviewer-js'; ncbi.sg.ping(obj) };
                while (args.length) SeqView.ping(args.shift());
                SeqView.ping(a);
            } else {
                if (args.length > 5) console.log('DROPPED PING: ' + JSON.stringify(args.shift()));
                args.push(a);
            }
        }
     };


    constructor.getApps = function() {
        return sm_Apps;
    };

    constructor.simpleAjaxRequest = function(cfg) {
        cfg.xhrFields = {withCredentials: true};
        Ext.applyIf(cfg, {type: 'POST'});
        cfg.crossDomain = true;
        Ext.applyIf(cfg, {dataType: SeqView.jsonType});
        jQuery.support.cors = true;
        try {
            return jQuery.ajax(cfg);
        } catch (e)
        { return e;};
    },

    constructor.findAppByIndex = function(app_idx) {
        for(var i = 0; i < sm_Apps.length; ++i) {
            if (sm_Apps[i].m_Idx == app_idx) {
                return sm_Apps[i];
            }
        }
        return null;
    };

    constructor.findAppByDivId = function(div_id) {
        for(var i = 0; i < sm_Apps.length; ++i) {
            if (sm_Apps[i].m_DivId == div_id) {
                return sm_Apps[i];
            }
        }
        return null;
    };

    constructor.showLinkURLDlg = function(app_idx, logarea) {
        var app = this.findAppByIndex(app_idx);
        if (logarea) SeqView.pingClick(logarea);
        if (app) { app.showLinkURLDlg(); }
    };

    constructor.showFeedbackDlg = function(app_idx, logarea) {
        var app = this.findAppByIndex(app_idx);
        if (logarea) SeqView.pingClick(logarea);
        if (app) { app.showFeedbackDlg(); }
    };

    constructor.showPrintPageDlg = function(app_idx) {
        var app = this.findAppByIndex(app_idx);
        if (app) { app.showPrintPageDlg(); }
    };

    return constructor;
})();

Ext.extend(SeqView.App, Ext.util.Observable, {
    getApi: function() {
        return new SeqView.Api(this);
    },
//////////////////////////////////////////////////////////////////////////
// doWindowResize

    doWindowResize: function(w,h) {
        if (this.m_BrowWidth != w) {
            this.reloadAllViews();
            this.m_BrowWidth = w;
        }
        this.doLayout();
    },

//////////////////////////////////////////////////////////////////////////
// reload:

    reload: function(rel_attr, keep_config) {
        if (this.m_AjaxTrans) {
        // kill all active ajax requests
            Ext.each(this.m_AjaxTrans,function(tid) {
                Ext.Ajax.abort(tid);
            });
            delete this.m_AjaxTrans;
            this.forEachView(function(v) {
                v.destroy();
            });
            this.m_Views = [];
        }
        this.m_Panorama = null;
        this.forEachView(function(v) {
            v.destroy();
        });

        var view = Ext.get(this.m_DivJSId)

        if (view) {
            view.remove();
            delete view;
        }
        view = Ext.get(this.m_DivCtrlId);
        if (view) {
            view.remove();
            delete view;
        }
        if (keep_config !== true)
            delete this.m_Config;
        if (this.m_PermConfId) {
            var el = Ext.get(this.m_PermConfId);
            if (el) {
                var fc = el.first()
                if (fc)
                    fc.remove();
            }
        }
        this.load(rel_attr);
    },

//////////////////////////////////////////////////////////////////////////
// initLinks: initialize GI and data independent links, all other links
// are initialized in loadAccession
    initLinks: function() {
        var prefix = SeqView.base_url;
        var uud_prefix = SeqView.uud_base_url;
        var html_prefix = prefix;
        if (window.sv_base_html !== undefined) html_prefix = window.sv_base_html;
        if (html_prefix.length > 0 && html_prefix.charAt(html_prefix.length-1) !== '/') html_prefix += '/';
        this.m_CGIs = {
            prefix:     prefix,
            html_prefix: html_prefix,
            FeatSearch: prefix + 'sv_search.cgi',
            ObjInfo:    prefix + 'seqgraphic.cgi',
            SvDataUpload: uud_prefix + 'sv_dl.cgi',
            SvMeta:     uud_prefix + 'dl_meta.cgi',
            SvFileUpload: 'https://submit.ncbi.nlm.nih.gov/projects/uud/ul/file_upload.cgi',
            NetCache:   prefix + 'ncfetch.cgi',
            Feedback:   prefix + 'feedback.cgi',
            Config:     prefix + 'seqconfig.cgi',
            Panorama:   prefix + 'seqgraphic.cgi',
            Graphic:    prefix + 'seqgraphic.cgi',
            Alignment:  prefix + 'alnmulti.cgi',
            ObjCoords:  prefix + 'seqgraphic.cgi',
            Sequence:   prefix + 'seqfeat.cgi',
            Link:       prefix + 'link.cgi',
            SequenceSave: prefix + 'sequence.cgi',
            Watchdog:   prefix + 'sv_watchdog.cgi',
            SearchMru:  prefix + 'sv_mru.cgi'
        };
     if (this.m_hiddenOptions.search('use_jsonp') >= 0)    SeqView.jsonType = 'JSONP';
        else {
            SeqView.jsonType = 'JSON';
            if (Ext.isIE) {
                SeqView.App.simpleAjaxRequest({url: this.m_CGIs.Link, context: this,/* dataType: 'JSON',*/
                    success: function(data, text) { SeqView.jsonType = 'JSON'; },
                    error: function(data, text) { SeqView.jsonType = 'JSONP'; }
                });
            }
        }
    },


    loadDataSuccess: function(callback) {
        var frontpage_text = Ext.get('app-frontpage');

        if (this.GI){
            if (frontpage_text) {
                frontpage_text.remove();
            }
            this.createAndLoadMainPanel(callback);
        } else {
            if (frontpage_text) {
                frontpage_text.setStyle('display', 'block');
            }
            var button = Ext.get('mainshow-btn');
            if (button) {
                button.on('click', function() { this.loadAccessionDlg();  }, this);
            }
        }
    },

    finishload: function(callback) {
        if (!this.m_Config)
            this.m_Config = new SeqView.Config(this);
        this.loadExtraData(callback);
    },

    load: function(rel_attr, maxDelay) {
        if (typeof maxDelay === 'undefined') maxDelay = 1000;
        var interval = 3;
        var app = this;
        setTimeout(function() { // Delay to allow jQuery to get ready
            maxDelay -= interval;
            if (typeof TMS === 'undefined' && maxDelay > 0)
                app.load(rel_attr, maxDelay);
            else {
                app.parseParams(rel_attr);
                app.initLinks();
                app.finishload();
            }
        },interval);
    },

    // callback object with success and failure defined
    reset: function(callback, reload) {
        this.m_Config = new SeqView.Config(this);
        if (reload) {
            if (this.m_MarkersInfo) {
                this.m_MarkersInfo.reset();
            }
            if (this.m_Reflections) {
                this.m_Reflections.deleteAll();
            }
            this.forEachView( function(view) { view.remove(); } )
            this.m_Views = [];
            this.m_InitialLoading = true;
        }
        var succ_fn = callback && callback.success ? callback.success : function() {};
        var fail_fn = callback && callback.failure ? callback.failure : function() {};
        this.m_Config.load({
            defaultcfg: true,
            resettracks: true,
            callback: {
                success: function(res) { if (reload) { this.infoLoaded(res); } succ_fn(); },
                failure: function(data, text, res) { this.infoFailed(data, text, res); fail_fn(); },
                scope:   this
            }
        });
    },

    // repackage DisplayOptions and TrackConfig to the shape ready for consumption
    // by api functions getDisplayOptions and getTracks
    postProcessConfig: function() {
        // Recode m_Config.DisplayOptions from array to map from track key to track object
        if (!('DisplayOptions' in this.m_Config)) {
            return;
        }
        var tracks = this.m_Config.DisplayOptions.tracks;
        var new_tracks = {};
        for (var i = 0; i < tracks.length; i++) {
            var key = tracks[i].key;
            if ('subkey' in tracks[i]) {
                key += '.' + tracks[i].subkey;
            }
            new_tracks[key] =  tracks[i];
        }
        this.m_Config.DisplayOptions.tracks = new_tracks;
    },

    getTrackObjects: function(all) {
        var tracks = [];
        Ext.each(this.m_Config.TrackConfig, function(track) {
            if (track.shown || all) {
                tracks.push(track);
            }
        });
        tracks.sort(function(t1,t2) {
            return t1.order - t2.order;
        });
        return tracks;
    },

    getTracks: function() {
        return this.getActTracks();
    },

    getActTracks: function() {
        if (this.m_actTracks == '') {
            this.m_actTracks = SeqView.TM.tracksArrayToString(this.getActiveTracks(), true);
        }
        return this.m_actTracks;
    },

    getConfiguration: function() {
        return this.m_Config;
    },

    // Returns an array of track info objects intended for easy constructing
    // 'tracks' URL parameter for subsequence embedding of Sequence Viewer
    // For complete track string either call getTrackStringFromInfo, or embed
    // it's code into your own app.
    getTracksInfo: function() {
        tracks = [];
        for (var i = 0; i < this.m_Config.TrackConfig.length; i++) {
            var track = this.m_Config.TrackConfig[i];
            tracks.push({
                name:  track.name,
                order: track.order,
                shown: track.shown,
                descr: SeqView.TM.trackToString(track)
            });
        }
        return tracks;
    },

    // Returns tracks parameter for Sequence Viewer, use it to construct parameter
    // string for embedding. Does not have parameter name, 'tracks', only value -
    // series of brace enclosed strings describing tracks.
    getTrackStringFromInfo: function(tracks_array) {
        var str = '';
        for (var i = 0; i < tracks_array.length; i++) {
            var track = tracks_array[i];
            str += '[' + track.descr;
            str += ',order:' + track.order;
            str += ',shown:' + (track.shown ? 'true' : 'false');
            str += ']';
        }
        return str;
    },

//////////////////////////////////////////////////////////////////////////
// clearParams:

    clearParams: function() {

        this.GI = null;
        this.m_From = null;
        this.m_To = null;
        this.m_ViewSearch = null;
        this.m_ViewSlimModes = [];
        // New markers
        this.m_Markers = [];
        this.m_Views = [];
        this.m_Reflections = null;
        this.m_MarkersInfo = null;
        this.m_TextView = null;

        this.m_ViewMarkers = false;
        this.m_Key = null;
        this.m_NAA = null;
        this.m_BamPath = null;
        this.m_SRZ = null;
        this.m_hiddenOptions = '';
        this.m_actTracks = "";
        this.m_userData = [];
        this.m_userTrackNames = [];
        this.m_FindCompartments = true;
        this.m_NeedAlignmentView = false;
        this.m_OnlyAlignmentView = false;
        this.m_DepthLimit = null;
        this.m_AppContext = null;

        this.m_Origin = 0;
        this.m_Flip = false;
        this.m_ViewLabels = null;
        this.m_Embedded = false;
        this.m_SnpFilter = null;
        this.m_ViewSeq = null;

        this.m_ViewOptions = {};
        this.m_ViewRanges = [];
        this.m_ViewColors = [];
        this.m_ViewsSelect = [];
        delete this.m_ViewTheme;
        delete this.m_ViewContent;
        delete this.m_AppName;

        delete this.m_Panel;
        this.m_Panel = null;
        this.m_ViewParams = null;
        this.m_ItemID = null;

        this.m_LocalPrimerTool = false;
        this.m_LocalBlast = false;
        this.m_ShowQuery = false;
        this.m_QueryRange = null;
        this.m_NoDataCookie = false;

        this.m_GraphicExtraParams = {};

        this.m_Toolbar = {
            history: true,
            name: true,
            search: true,
            panning: true,
            zoom: true,
            modeswitch: true,
            tools: true,
            config: true,
            reload: true,
            help: true
        };
    },

//////////////////////////////////////////////////////////////////////////
// parseParams:

    parseParams: function(rel_attr) {
        this.clearParams();
        delete SeqView.requestTrackSets;
        var doc_location = document.location.href;
        this.m_AllViewParams = doc_location.split("?")[1] || '';
        this.m_AllViewParams = this.m_AllViewParams.replace(/#/, ''); // safety

        if (!rel_attr) {
            var rel = Ext.get(this.m_DivId);
            if (rel && rel.dom) {
                var aref = rel.first();
                if (aref && aref.dom && aref.dom.tagName == "A") {
                    rel_attr = aref.dom.href.slice(aref.dom.href.indexOf('?') + 1)
                    aref.remove();
                } else { // for compatibility with the old verions
                    rel_attr = rel.dom.getAttribute('rel');
                }
            }
        }
        if (rel_attr != null) {
            var href = this.m_AllViewParams;
            var keep = ''; 
            var pLst = ['parallel_render', 'extra_opts'];
            Ext.each(pLst, function(p){
                var idx = href.indexOf(p);
                if (idx < 0) return;
                keep += '&' + href.slice(idx).split('&')[0]
            });
            // We should not merge URL parameters in for embedded viewers.
            // Better is to parse rel_attr into parameter set first,
            // but this is reliable enough - equal sign in all other
            // places beyond parameter definition should be escaped
            this.m_AllViewParams = (/embedded=/.test(rel_attr))
                ? rel_attr
                : this.m_AllViewParams + '&' + rel_attr;
            this.m_AllViewParams += keep;
        }
        this.m_AllViewParams = Ext.util.Format.htmlDecode(this.m_AllViewParams);

        this.m_MarkersInfo = new SeqView.MarkersInfo(this);

        var marker_ranges = [];
        var marker_names = [];
        if (this.m_AllViewParams) {
            var p_array = this.m_AllViewParams.split('&');

            delete this.mf_MultiPanel;
            var sKeys= ['key', 'naa', 'tracks', 'tkey', 'tn', 'rkey', 'mn', 'mk',
                        'url', 'url_reload', 'rid', 'data', 'id', 'select',
                        'srz', 'content', 'viewer_context', 'app_context',
                        'assm_context', 'snp_filter', 'bam_path', 'theme', 'search'];

            for (var i = 0; i < p_array.length; i++) {
                var pair = p_array[i]
                var p = pair.split("=");
                var the_key = p[0].toLowerCase();

                var val = (p[1] === undefined ? '' : unescape(p[1]));
                
                if (sKeys.indexOf(the_key) == -1) val = val.toLowerCase();
                
                switch (the_key) {
                    case 'id': this.GI = val; break;
                    case 'f': case 'from': this.m_From = val; break;
                    case 't': case 'to':  this.m_To = val; break;
//                    case 'test': this.m_Test = val=="true" || val=="1"; break;
                    case 'gl_debug': if (val == '1' || val == 'true') this.m_GraphicExtraParams['gl_debug'] = 'true'; break;
                    case '_gene': case 'gene': this.m_ViewSearch = val; break;
                    // old way to parse markers
                    case 'm': marker_ranges = val.split(','); break; // like: m=249,276
                    case 'mn': marker_names = val.split(','); break; // like: mn=Marker 1,Marker 2
                    // new way, integrated parameter mk=249:250|Marker 1|ff0000,276|Marker 2|00ff00
                    case 'mk': this.m_MarkersInfo.parseMarkersURL(this.m_Markers, val);  break;
                    case 'search': this.m_ViewSearch = val; break; // like: search=feature_name
                    case 'vm': this.m_ViewMarkers = true; break; // like: vm=true
                    case 'key': this.m_Key = val; break;// like: db=nucleotide
                    case 'naa': this.m_NAA = val; break; // like: naa=NA000000003,NA000000004, NA000000004:renderer_name
                    case 'bam_path': this.m_BamPath = val; break;
                    case 'srz': this.m_SRZ = val; break; // like: srz=SRZ000200
                    case 'depth_limit': this.m_DepthLimit = val;  break;
                    case 'tracks': this.m_TracksFromURL = val; break;
                    case 'tn': this.m_userTrackNames.push(decodeURIComponent(val)); break;
                    case 'find_comp': this.m_FindCompartments = val == "true" || val == "1" || val == "on"; break;
                    case 'data': val = decodeURIComponent(val); // literal data, URI component encoded
                    case 'rkey':
                    case 'rid':  
                    case 'url_reload': // the same like 'url' with check_cs = true 
                    case 'url': this.m_userData.push([the_key, val]); break; // like: url=www.ncbi.nlm.nih.gov/data.txt
                    case 'align': this.m_NeedAlignmentView = true; break;
                    case 'onlyalign': this.m_OnlyAlignmentView = true; break;
                    case 'labels': this.m_ViewLabels = val; break;
                    case 'embedded': this.m_Embedded = val == "true" || val == "1" || val; break;
                    case 'multipanel': this.mf_MultiPanel = (val == '1' || val == 'true' || val == '' || val == null); break;
                    case 'snp_filter': this.m_SnpFilter = val; break;// like: Validated|000010000%20-1%20-1%20-1%20_%20_%20_%2043%20_%20_%20
                    case 'origin': this.m_Origin = parseInt(val); break;// like: origin=10000 ; 0-based
                    case 'seq': this.m_ViewSeq = val.split(':'); break;// like: seq=2000:7000

                    case 'color': // Options are global to SeqView app take only 0-item
                    case 'label': 
                    case 'decor': 
                    case 'spacing': this.m_ViewOptions[the_key] = val.split(',')[0]; break;
                    case 'theme': this.m_ViewTheme = val.split(',')[0]; break; // like: theme=Compact,Details
                    case 'content': this.m_ViewContent = val.split(',')[0]; break;

                    case 'v': if(val.length) { this.m_ViewRanges = val.split(','); } break; // like: v=1000:6000,8000:18723
                    case 'c': this.m_ViewColors = val.split(','); break; // like: color=0000FF,FFFF99
                    case 'slim': this.m_ViewSlimModes = val.split(','); break; // like: slim=1,0,... or slim=true,false,...
                    case 'gflip': this.m_Flip = val=="true" || val=="1"; break; // gflip=true
                    case 'flip': case 'strand': var parts = val.split(','); // like: flip=true,false
                        if (parts && parts.length > 0) this.m_Flip = parts[0]=="true" || parts[0]=="1";
                        break;
                    case 'select': this.m_ViewsSelect = val.split(','); break; // like: select=
                    case 'itemid': this.m_ItemID = val; break;
                    case 'noviewheader': this.m_NoViewHeader = val=="true" || val=="1"; break;
                    case 'viewer_context': this.m_ViewerContext=val; break;
                    case 'app_context': this.m_AppContext=val; break;
                    case 'assm_context': this.m_AssmContext=val; break;
                    case 'nopdf': this.m_NoPDF = val=="true" || val=="1"; break;

                    case 'extra_opts': this.m_hiddenOptions = val; break;
                    case 'parallel_render': this.m_parallelRender = val; break;
                    case 'iframe': this.m_iFrame = val; break;
                    case 'nodatacookie': this.m_NoDataCookie = val=="true" || val=="1"; break;
                    case 'showquery': this.m_ShowQuery = val=="true" || val=="1"; break;
                    case 'queryrange': var parts = val.split(':');
                        if (parts && parts.length > 1) {
                            this.m_ShowQuery = true;
                            this.m_QueryRange = [ parseInt(parts[0]), parseInt(parts[1])];
                        }
                        break;

                    case 'primer': if (location.pathname.indexOf('staff') != -1) this.m_LocalPrimerTool = val=="true" || val=="1"; break;
                    case 'blast': if (val == 'web') this.m_LocalBlast = 'web'; else this.m_LocalBlast = val=="true" || val=="1"; break;
                    case 'tkey': this.m_TKey = val; break;
                    case 'appname': if (val && val.length > 0) this.m_AppName = val; break;
                    case 'noconfdlg': this.m_NoConfDlg = val=="true" || val=="1"; break;
                    case 'toolbar': if (!val) break;
                        var add = val.charAt(0) != '-';
                        var start = add ? 0 : 1;
                        if (add) this.m_Toolbar = {};
                        for (var j = start; j < val.length; j++) {
                            switch (val.charAt(j)) {
                                case 'b': this.m_Toolbar["history"] = add; break;
                                case 'n': this.m_Toolbar["name"] = add; break;
                                case 's': this.m_Toolbar["search"] = add; break;
                                case 'p': this.m_Toolbar["panning"] = add; break;
                                case 'z': this.m_Toolbar["zoom"] = add; break;
                                case 'm': this.m_Toolbar["modeswitch"] = add; break;
                                case 't': this.m_Toolbar["tools"] = add; break;
                                case 'c': this.m_Toolbar["config"] = add; break;
                                case 'r': this.m_Toolbar["reload"] = add; break;
                                case 'h': this.m_Toolbar["help"] = add; break;
                            }
                        }
                        break;
                }
                SeqView.TM.renderStat = this.m_hiddenOptions.indexOf('render_stat') >= 0;

            } // for

            if( this.mf_MultiPanel === undefined ){
                this.mf_MultiPanel = !this.m_Embedded;
            }

            if (this.m_Embedded && !this.m_NoDataCookie) {
                var cookie_name = SeqView.Cookies.UserDataCookieName;
                if (this.m_AppName && this.m_AppName.length > 0 && cookie_name === SeqView.Cookies.UserDataCookieNameBase) {
                    cookie_name += '-' + this.m_AppName;
                }

                if( !this.m_Key ){
                    // if the NC key with the user's data is not passed check if it is set in cookies
                    this.m_Key = SeqView.SessionData.get( cookie_name, null );
                } else {
                    // save it into a session cookie
                    SeqView.SessionData.set( cookie_name, this.m_Key );
                }
            }
        } // view
        this.m_MarkersInfo.parseMarkersOldStyle(this.m_Markers, marker_ranges, marker_names);

        var ncbi_portal_app = "ncbientrez";

        this.m_Portal =
            this.m_Embedded === false
            && this.m_AppName
            && this.m_AppName.substring( 0, ncbi_portal_app.length ) == ncbi_portal_app
        ;

        var  cfg = [];
        if( this.m_Embedded ){
            var cfg_id = Ext.get(this.m_DivId+'_confdlg');
            if (cfg_id) {
                this.m_PermConfId = this.m_DivId+'_confdlg';
            }
            cfg = [{tag: 'div', id: this.m_DivJSId}];
        } else {
            var tmpl = new Ext.Template(
                 '<a onClick="SeqView.App.showLinkURLDlg('+this.m_Idx+', \'3-0\');" href="#">Link To This Page</a> | ',
                 '<a onClick="SeqView.App.showFeedbackDlg('+this.m_Idx+', \'3-1\');" href="#">Feedback</a>'// | ',
            );

            cfg = [
                {tag: 'div', cls: 'SeqViewerControls hidden_for_print', id: this.m_DivCtrlId, html:tmpl.apply()},
                //{tag:'br'},
                {tag: 'div', cls: 'SeqViewerJS', id: this.m_DivJSId}
            ];

        }

        if( this.GI || this.m_userData.length ){
            Ext.DomHelper.append( this.m_DivId, cfg );
            var view_config = {
                collapsible: (this.m_Embedded === false),
                renderTo: this.m_DivJSId,
                html:'<span id="string_ruler_unit"></span>',
                header: false
            };
            this.m_Panel = new Ext.Panel(view_config);
            this.m_Panel.add(new Ext.Panel({
                height: 60, border: false,
                items:[{xtype:'displayfield', name: 'progress', id:'sv-uplmsg' + this.m_DivId, value: '',
                             style: (Ext.isIE7 ? {} : {color:'grey', "text-align": 'left', "margin-top":'10px', "margin-left":'6px'})},
                       {xtype:'displayfield', name: 'error', id:'sv-uplerr' + this.m_DivId, value: '',
                             style: (Ext.isIE7 ? {} : {color:'red', "text-align": 'left', "margin-top":'10px', "margin-left":'6px'})}]
            }));
            this.m_Panel.tmpPanelFlag = true;
            this.m_Panel.doLayout();
        }
    },

    resizeIFrame: function( height ){

        if (!parent || !this.m_iFrame) return;

        var app_div = Ext.get( this.m_DivId );
        var total_height = app_div.getHeight();
        if( Ext.isIE7 && !this.m_Embedded && total_height < 400 ){
            total_height = 400;
        } else if( Ext.isIE ){
            total_height += 4;
        }

        if( height && height > total_height ){
            total_height = height;
        }
        if (!SeqView.m_parent){
            try {
                var elemid = parent.document.getElementById(this.m_iFrame);
            } catch(e) {
                var a = document.createElement('a');
                a.href = document.referrer;
                SeqView.m_parent = a.origin || a.href.slice(0, a.href.indexOf(a.hostname,0) + a.hostname.length);
            }
        }
        if (elemid) elemid.height = total_height;
        else parent.postMessage(total_height, SeqView.m_parent);
    },

//////////////////////////////////////////////////////////////////////////
// openNewWindowPOST(url, params) - open new window by POSTing 'params' to 'url'
//     url - URL to use for POST
//     params - object with parameters to pass in the POST request
    openNewWindowPOST: function(url, params) {
        var new_win = window.open('about:blank', '_blank');
        new_win.focus();
        var new_body = new_win.document['body'];
        var form = new_win.document.createElement('form');
        form.method = 'POST';
        for (var name in params) {
            if (!params.hasOwnProperty(name)) continue;
            var el = new_win.document.createElement('input');
            el.type = 'hidden';
            el.name = name;
            el.value = params[name];
            form.appendChild(el);
        }
        new_body.appendChild(form);
        form.action = url;
        form.submit();
    },

    blast: function(range) {
        var params = {};
        params["SV_SHOW"] = "TRUE";
        if (this.m_Key) {
            params["SV_KEY"] = this.m_Key;
        }
        params["PAGE_TYPE"] = "BlastSearch";
        params["SHOW_DEFAULTS"] = "on";
        if (this.m_ViewParams['acc_type']=='protein') {
            params["PROGRAM"] = "blastp";
            params["BLAST_PROGRAMS"] = "blastp";
        } else {
            params["PAGE"] = "Nucleotides";
            params["PROGRAM"] = "blastn";
            params["MEGABLAST"] = "on";
            params["BLAST_PROGRAMS"] = "megaBlast";
        }
        if (range) {
            params["QUERY_FROM"] = (range[0]+1);
            params["QUERY_TO"]   = (range[1]+1);
        }
        var prod = SeqView.host_url.indexOf("www.ncbi.nlm.nih.gov") != -1;
        var prefix = this.m_LocalBlast === 'web' ? "https://web.ncbi.nlm.nih.gov/blast/" : (
                                           this.m_LocalBlast ? "" : (prod ? "https://blast.ncbi.nlm.nih.gov/" :
                                           SeqView.host_url + "blast/"));
        var url = prefix + "Blast.cgi";
        // check local id, fill out query with sequence in this case
        if (this.GI.indexOf("lcl|") != 0) {
            params["QUERY"] = this.GI;
            this.openNewWindowPOST(url, params);
        } else {
            var ranges = "0-" + (this.m_SeqLength-1);
            SeqView.App.simpleAjaxRequest({
                url: this.m_CGIs.SequenceSave, context: this,
                data: { id: this.GI, ranges: ranges, format: "fasta", nofile: "true", key: this.m_Key },
                dataType: "text",
                success: function(data, text, res) {
                    // The define line is coming with coordinate range, which Blast does not understand.
                    // So, we need to remove it from, e.g. ">lcl|Query_1:1-2534" to read ">lcl|Query_1"
                    params["QUERY"] = data.replace(/>(lcl\|.*):\d+-\d+/, function(m, p1) { return ">" + p1; });
                    params["QUERY_BELIEVE_DEFLINE"]="true";
                    this.openNewWindowPOST(url, params);
                },
                error: function(data, text, res) {
                    console.log("sequence.cgi failure - " + res);
                }
            });
        }
    },

//////////////////////////////////////////////////////////////////////////
// primerBlast:
    primerBlast: function(whole, range_set) {
        var seqinfo = this.m_ViewParams;
        if (seqinfo["acc_type"] !== "DNA") return;
        if (!whole  &&
            (!range_set || range_set.length < 1 || range_set.length > 2)) return;
        var url = this.m_LocalPrimerTool
            ? "primer-blast/index.cgi?"
            : "/tools/primer-blast/index.cgi?"
        ;
        url += "ORGANISM=" + encodeURI(seqinfo["organism"]);
        url += "&INPUT_SEQUENCE=" + encodeURI(seqinfo["id"]);
        var total_range;
        if (whole)
            total_range = [0, this.m_SeqLength-1];
        else
            total_range = range_set[0];
        if (!whole  &&  range_set.length === 2) {
            var range0, range1;
            if (range_set[0][1] < range_set[1][0]) {
                var range0 = range_set[0];
                var range1 = range_set[1];
            } else {
                var range0 = range_set[1];
                var range1 = range_set[0];
            }
            url += "&PRIMER5_END=" + (range0[1]+1);
            url += "&PRIMER3_START=" + (range1[0]+1);
            total_range = [ range0[0], range1[1] ];
        }
        url += "&PRIMER5_START=" + (total_range[0]+1);
        url += "&PRIMER3_END=" + (total_range[1]+1);
        url += "&PRIMER_PRODUCT_MAX=" + (total_range[1] - total_range[0]);
        url += "&SHOW_SVIEWER=true";
        if (this.m_Key) {
            url += "&SVIEWER_DATA_KEY=" + this.m_Key;
        }
        window.open(url);
    },

    createAndLoadMainPanel: function(callback) {
        this.m_BrowWidth = Ext.lib.Dom.getViewWidth();
        Ext.fly(this.m_DivId).on({'contextmenu': this.onContextMenu, scope: this});
        this.loadAccession(callback);
    },

    onContextMenu: function(e) {
        if (e.getTarget().id.search('sv-goto-box_') == 0) return;
        e.preventDefault();  // this prevents the default contextmenu to open in Firefox (linux)
        e.stopPropagation();
    },

//////////////////////////////////////////////////////////////////////////
// requestGI:

    requestGI: function() {
        Ext.get('app-frontpage').setStyle('display', 'block');
        var button = Ext.get('mainshow-btn');
        button.on('click', function() { this.loadAccessionDlg();  },this);
    },

//////////////////////////////////////////////////////////////////////////
// loadAccessionDlg:

    loadAccessionDlg: function() {
        Ext.MessageBox.prompt('Load Accession', 'Please enter accession or GI:', function(btn, text) {
            if (btn!='ok'  || text.length==0) return;
            this.redirectWithGi(text);
        }, this, false, this.GI);
    },

    redirectWithGi: function(text_gi) {
        var url = this.m_CGIs.Config;
        this.AjaxRequest({url:url  + '?id=' + (text_gi) + '&notrackconfig=true', context: this,
            success:function(data, text, res) {
                var from_cgi = SeqView.decode(data);
                if (from_cgi.job_status) {
                    var st = from_cgi.job_status;
                    if (st == 'submitted' || st == 'running' || st == 'pending') {
                        SeqView.App.simpleAjaxRequest.defer(2000, this, {url: url + '?job_key=' + from_cgi.job_id, context: this});
                        return;
                     }
                }
                if (from_cgi.error) {
                    Ext.MessageBox.show({title: 'Sequence Viewer', msg:from_cgi.error,
                                         buttons: Ext.MessageBox.OK, icon:Ext.MessageBox.ERROR});
                } else if(from_cgi.success === false) {
                    Ext.MessageBox.show({title: 'Sequence Viewer', msg:from_cgi.msg,
                                         buttons: Ext.MessageBox.OK, icon:Ext.MessageBox.ERROR});
                } else {
                    var href = document.location.href.replace(/#/, '');
                    var pars = href.split("?");
                    var args = pars[1] ? pars[1].split('&') : [];
                    var idx = Ext.each(args, function(v) { if (v.substr(0,3) == 'id=') return false; })
                    if (idx != undefined)
                        args.remove(args[idx]);
                    var view_url = pars[0];
                    view_url += '?id=' + text_gi;
                    if (args.length > 0)
                        view_url += '&' + args.join('&');
                    document.location.href = view_url;
                }
            }});
    },

//////////////////////////////////////////////////////////////////////////
// showTracksConfigDlg:

    showTracksConfigDlg: function(active_tab) {
        SeqView.TM.ShowConfigDialog(this,active_tab);
    },

    showTracksConfigPanel: function(active_tab) {
        SeqView.TM.ShowConfigPanel(this,active_tab);
    },

    updateConfig: function(newconfig, user_data, tracks) {
        //Ext.apply(this.m_Config.TrackConfig,newconfig.TrackConfig);
        this.m_Config.TrackConfig = newconfig.TrackConfig;
        Ext.apply(this.m_Config.Options, newconfig.Options);
//        this.m_Key = user_data;
        this.m_actTracks = tracks;
        this.reloadAllViews();
        delete this.m_currentTrackSetId;
        this.fireEvent('configuration_changed', this);
    },


//////////////////////////////////////////////////////////////////////////
// showTracks: show/hide tracks matching the query. NB: This function does NOT
//             refresh the view, do it yourself after the call if it returned
//             true.
//    query - object to match with the track to operate on, currently 2 keys
//            supported - "category" and "name". Conditions are joned by AND
//            so if you turn on track with {category: "Variation", name: "SNP" }
//            only tracks with matching category AND names become active.
//            Default (empty object) means ALL tracks.
//    show  - boolean, whether to turn tracks on or off, default off
//    save  - should we save new track configuration, default no
//  returns whether track configuration changed
    showTracks: function(query, show, save) {
        var active_tracks = [];
        var changed = false;
        Ext.each(this.m_Config.TrackConfig, function(track) {
            var shown = track.shown;
            // concatenate conditions with AND
            var select = true;
            if (query.name) {
                select = select && (track.name === query.name);
            }
            if (query.key) {
                select = select && (track.key === query.key);
            }
            if (query.category) {
                select = select && (track.category.name === query.category);
            }
            if (select) {
                track.shown = show;
            }
            if (track.shown) {
                active_tracks.push(track);
            }
            if (shown != track.shown) changed = true;
        });
        active_tracks.sort(function(t1,t2) {
            return t1.order - t2.order;
        });
        this.m_actTracks = SeqView.TM.tracksArrayToString(active_tracks, true);
        if (save) {
            var tracks_for_save = SeqView.TM.tracksArrayToString(this.m_Config.TrackConfig, true, true);
            // We don't handle callback succes/error here because we already modified the original
            // config, and disregarding whether it saved successfully or not we can't undo this.
            this.m_Config.save({tracks: tracks_for_save});
        }
        return changed;
   },

    getActiveTracks: function(addHidden) {
        var active_tracks = [];
        var subtracks = [];
        var trackConfig = this.m_Config.TrackConfig;
        Ext.each(trackConfig, function(track) {
            if (!track.shown) return true;
            active_tracks.push(track);
            Ext.each(track.subTracks, function(uId, idx) {
                var legend = track.legend[idx];
                if (addHidden || uId.substr(-7) !== '_hidden') subtracks.push(legend);
                Ext.each(trackConfig, function(ct, cfgIdx) {
                    if (ct.id == legend.id) {
                        var opacity = Math.round(legend.color.split(' ')[3]/2.55);
                        Ext.each(ct.hidden_settings, function() { legend[this.name] = this.value; });
                        if (!legend.hasOwnProperty('opacity')) {
                           ct.hidden_settings.push({name: 'opacity', value: opacity});
                           legend.opacity = opacity;
                        }
                        legend.idx = cfgIdx;
                        return false;
                    }
                });
            });
        });
        active_tracks.sort(function(t1,t2) { return t1.order - t2.order; });

        Ext.each(subtracks, function() {
            var trk = trackConfig[this.idx];
            if (trk && !trk.shown) active_tracks.push(trk);
        });
        return active_tracks;
    },

    loadAccession: function(callback) {
        var succ_fn = callback && callback.success ? callback.success : function() {};
        var fail_fn = callback && callback.failure ? callback.failure : function() {};
        if (!this.GI)
            return;

        if (this.m_MarkersInfo) {
            this.m_MarkersInfo.reset();
        }
        if (this.m_Reflections) {
            this.m_Reflections.deleteAll();
        }

        this.forEachView( function(view) { view.remove(); } )
        this.m_Views = [];
        this.m_InitialLoading = true;

        var cfg = {
            callback: {
                success: function(res) { this.infoLoaded(res); succ_fn(); },
                failure: function(data, text, res) { this.infoFailed(data, text, res); fail_fn(); },
                scope:   this
            }
        };

        if( this.m_TKey && this.m_TKey.length > 0 ){
            var params = {what:'tracks', key: this.m_TKey};
            this.AjaxRequest({
                url: this.m_CGIs.SvMeta, data: params, context:this,
                success: function(data, text, res){
                    if (data.success === true) this.m_TracksFromURL = data.tracks;
                    delete this.m_TKey;
                    this.m_Config.load(cfg);
                },
                error: function(data, text, res){
                    delete this.m_TKey;
                    this.m_Config.load(cfg);
                }
            });
        } else {
            this.m_Config.load(cfg);
        }
    },


    infoFailed: function(data, text, res){
        var ddata = SeqView.decode(data);
        if (typeof ddata === 'object') {
            var msg = ddata.msg || ddata.statusText || ddata.error_message;
        }
        this.m_Panel.getEl().insertHtml("afterBegin",
            'An internal error has occurred that prevents Sequence Viewer from displaying.<br> Technical details (seqconfig error): ' + (msg || text));
    },

//////////////////////////////////////////////////////////////////////////
// infoLoaded:

    infoLoaded: function(seqconfig) {
        if (this.m_PermConfId)
            this.showTracksConfigPanel(0);
            
        this.m_ViewParams = this.m_Config.SeqInfo;
        this.m_AssmContext = this.m_ViewParams.assm_context;
        this.m_actTracks = SeqView.TM.generateTracksString(SeqView.TM.processTracksInfo(this.m_Config.TrackConfig));

        this.postProcessConfig();

        this.fireEvent('configuration_loaded', this);

        if (this.m_Embedded === false)
            document.title = this.m_ViewParams['id'] + ': ' + this.m_ViewParams['title'];

        var title_place = Ext.get(this.m_DivTitle);
        if (title_place) title_place.update(this.m_ViewParams['title']);

        var title_id = Ext.get(this.m_DivTitleID);
        if (title_id) title_id.update(this.m_ViewParams['id_full']);

        this.m_Panel.setTitle(this.m_ViewParams['id']);
        this.m_SeqLength = this.m_ViewParams['length'];
        var views = this.m_ViewParams['views'];
        var suggested_ranges = [];
        for (var i = 0; i != views.length; i++) {
            var sp = views[i].split(':');
            // To prevent showing only alignment for PrimerBlast we make an exception here
            if (sp[0]=='multialign' && this.defaultConfig && this.defaultConfig.m_ViewContent != 'PrimerBlast') {
                this.m_NeedAlignmentView = true;
            }
            if (sp[0]=='graphical'  &&  sp[1]) {
                suggested_ranges = sp[1].split('-');
            }
            views[i] = sp[0];
        }

        Ext.each(['label','color','decor','spacing'], function(par) {
            var pidx = this.m_ViewOptions[par] || -1;
            if (pidx >= 0 && pidx < this.m_Config.Options.controls[par].length)
                this.m_Config.Options['curr_' + par] = this.m_Config.Options.controls[par][pidx];
        },this);
        
        if( this.m_Embedded === false || this.m_Embedded == 'panorama' || this.m_Embedded == 'full') {

            this.createPanorama();
        }

        var from, to;
        if (this.m_From && (this.m_From=="begin"  ||  this.m_From=="begining")) this.m_From = null;
        if (this.m_To && this.m_To=="end") this.m_To = null;
        if (!this.m_From && !this.m_To) {
            if (suggested_ranges[0]) {
                from =  SeqView.stringToNum(suggested_ranges[0]);
                to  =   SeqView.stringToNum(suggested_ranges[1]);
                m_From = (from + 1) + ''; // convert to string
                m_To   = (to + 1) + ''; // convert to string
            } else {
                from = 0;
                to = this.m_SeqLength-1;
                // to = this.m_SeqLength < 10000 ? this.m_SeqLength-1 : this.m_SeqLength > 500000 ? 75000 : this.m_SeqLength / 10;
            }
        } else {
            from = this.m_From ? SeqView.stringToNum(this.m_From)-1 : 0;
            to   = this.m_To   ? SeqView.stringToNum(this.m_To)-1   : this.m_SeqLength-1;
            // to   = this.m_To   ? SeqView.stringToNum(this.m_To)-1   :
            //    (this.m_SeqLength < 10000 ? this.m_SeqLength-1 : this.m_SeqLength > 500000 ? 75000 : this.m_SeqLength / 10);
        }

        if (this.m_QueryRange) {
            var overhang = Math.round(0.15 * (this.m_QueryRange[1] - this.m_QueryRange[0]));
            this.m_ViewRanges = [ Math.max(0, this.m_QueryRange[0]-overhang ) + ":" +
                                  Math.min(this.m_SeqLength-1, this.m_QueryRange[1]+overhang)];
        }

        // fix for old Portal format
        if (this.m_ViewRanges.length==1 && this.m_ViewRanges[0].indexOf('begin') != -1){
            this.m_ViewRanges = []; // ignore cases such as begin..end
        }
        if (this.m_Embedded == 'panorama') return;
        if (this.m_ViewRanges.length == 0) {
            this.m_ViewRanges[0] = (from + 1) + ':' + (to + 1);
        }

        if ((this.m_OnlyAlignmentView === true && this.m_Embedded === false) || (this.m_Embedded && this.m_NeedAlignmentView === true)) {
            var alview = new SeqView.Alignment(this);
            var the_r = this.m_ViewRanges[0];
            var range;

            if (the_r.indexOf(':') != -1) range = the_r.split(':');
            if (the_r.indexOf('..') != -1) range = the_r.split('..');
            if (the_r.indexOf('-') != -1) range = the_r.split('-');
            var zs = range[1] == 'zs';
            range = this.decodeRange(range);
            alview.m_FromSeq = range[0];
            //alview.m_LenSeq  = range[1] - range[0] + 1;
            alview.m_LenSeq  = this.m_SeqLength;
            if (zs) {
                alview.m_LenSeq -=  Math.floor(415 * SeqView.MinBpp); // adjust to align viewer borders
            }
            this.registerView(alview);
        } else {
            for (var i = 0; i < this.m_ViewRanges.length; ++i) {
                var view = new SeqView.Graphic(this);
                var the_r = this.m_ViewRanges[i];
                var range;

                if (the_r.indexOf(':') != -1) range = the_r.split(':');
                if (the_r.indexOf('..') != -1) range = the_r.split('..');
                if (the_r.indexOf('-') != -1) range = the_r.split('-');
                var zs = range[1] == 'zs';

                range = this.decodeRange(range);

                view.m_FromSeq = range[0];
                view.m_LenSeq  = range[1] - range[0] + 1;

                view.m_UrlFrom = range[0] ? range[0] +1 : null;
                view.m_UrlTo   = range[1] ? range[1] +1 : null;
                view.m_slimMode = false;
                var vsm = this.m_ViewSlimModes;
                if (vsm.length > i) view.m_slimMode = (vsm[i] == "true" || vsm[i] == "1");
                if (this.m_ViewColors.length > i) view.m_Color = this.m_ViewColors[i];
                view.setFlipNoReload(this.m_Flip, true);

                if (this.m_ViewsSelect.length > i  && this.m_ViewsSelect[i] != 'null') view.m_SelectedSig = this.m_ViewsSelect[i];

                this.registerView(view);

                if (i == 0 && this.m_NeedAlignmentView && this.m_Embedded === false) {
                    var alview = new SeqView.Alignment(this);
                    alview.m_FromSeq = range[0];
                    alview.m_LenSeq  = range[1] - range[0] + 1;
                    if (zs) {
                        alview.m_LenSeq -=  Math.floor(415 * SeqView.MinBpp); // adjust to align viewer borders
                    }
                    this.registerView(alview);
                }
            }
        }

        if (this.m_ViewSeq && this.m_ViewSeq.length > 0) {
            var from = SeqView.stringToNum(this.m_ViewSeq[0])-1;
            var to = SeqView.stringToNum(this.m_ViewSeq[1])-1;
            this.createTextView([from,to,this.m_Flip]);
        }
    },

//////////////////////////////////////////////////////////////////////////
//  getToolTipForTrack

    getToolTipForTrack: function(view,tname) {
        //for tracks extracting first part, delimited by ";"
        if(tname.match(";")){
            var arr = [];
            arr = tname.split(";");
            var gijunk = arr[1];//arr[1] is used for getting track name
            var id = [];
            id = gijunk.split("|");
            tname = id[1];
        }
        var tooltip = null;

        if (this.m_Config && this.m_Config.TrackConfig) {
            var tcfgs = this.m_Config.TrackConfig;
            Ext.each(tcfgs, function(cfg) {
                //if (cfg.Name == tname) {
                if (cfg.name == tname) {
                    //if (cfg.Help) tooltip = cfg.Help;
                    if (cfg.help) tooltip = cfg.help;
                    return false;
                }
            });
        }

        return tooltip;
    },

//////////////////////////////////////////////////////////////////////////
// notifyViewLoaded:

    notifyViewLoaded: function(view) {
        if(view != this.m_Panorama) {
            this.fireEvent('graphical_image_loaded', view);
        } else {
            this.fireEvent('panorama_image_loaded', view);
        }
        if (this.m_InitialLoading) {
            var loading_finished = true;
            this.forEachView(function(v) { loading_finished = loading_finished && !v.isLoading(); });
            if (loading_finished) {
                this.m_InitialLoading = false;

                if (!this.hasMarkers()) {
                    for (var m = 0; m != this.m_Markers.length; m++) {
                        this.addMarkerByData(this.m_Markers[m]);
                    }
                } // create markers from URL
                if (this.m_ViewMarkers) { // show marker info dialog?
                    this.m_ViewMarkers = false;
                    this.showMarkersDlg( view != this.m_Panorama ? view : null );
                }
                if (this.m_ViewSearch && this.m_ViewSearch.length > 0) {
                    var search_term = this.m_ViewSearch;
                    this.forEachView(function(v) {
                        var goto_box = Ext.getCmp('sv-goto-box_' + v.m_Idx);
                        if ( goto_box ){
                            goto_box.setValue(search_term);
                        }
                    });
                    this.gotoAndSearch(this.m_ViewSearch);
                }

                this.loadSearchPatternStore();
            }
            // we need to reload the panorama image in case if the browser added vscroll bar
            if (this.m_Panorama && this.m_Panorama.getWidth() != this.m_Panorama.getScreenWidth()) {
                this.m_Panorama.loadImage();
            }
        }
    },

//////////////////////////////////////////////////////////////////////////
// moveTo:

    moveTo: function(from, len){
        this.forEachView(function(v) {
            v.moveTo(from, len, {from_ui: false});
        });
    },

//////////////////////////////////////////////////////////////////////////
// addView:

    addView: function(cfg) {
        var view  = this.m_Panel.add(cfg);
        this.m_Panel.doLayout();
        return view;
    },

//////////////////////////////////////////////////////////////////////////
// doLayout:
    doLayout: function() {
        if (this.m_Panel)
            this.m_Panel.doLayout();
    },

//////////////////////////////////////////////////////////////////////////
// viewIsClosing:

    viewIsClosing: function(view) {
    },

//////////////////////////////////////////////////////////////////////////
// countActiveSeqPanels

    countActiveSeqPanels: function() {
        var count = 0;
        for (var i = 0; i < this.m_Views.length; i++) {
            if (this.m_Views[i] && this.m_Views[i].m_Type == 'graphical')
                count++;
        }
        return count;
    },

//////////////////////////////////////////////////////////////////////////
// removeView:

    removeView: function(view) {
        for (var i = 0; i < this.m_Views.length; i++) {
            var v = this.m_Views[i];
            if (v && v.m_Idx == view.m_Idx) {
                this.m_Views[i] = null;
            }
        }
        this.reCreateReflections();
    },

//////////////////////////////////////////////////////////////////////////
// createPanorama:

    createPanorama: function() {
        this.m_Panorama = new SeqView.Panorama(this);
        this.m_Views.push(this.m_Panorama);
        this.m_Panorama.loadImage();
    },

//////////////////////////////////////////////////////////////////////////
// loadPanoramaImage:

    loadPanoramaImage: function() {
        if (this.m_Panel && this.m_Panorama) {
            this.m_Panorama.loadImage();
        }
    },

//////////////////////////////////////////////////////////////////////////
// registerView:

    registerView: function(view) {
        this.m_Views.push(view);
        view.createPanel();
        this.reCreateReflections();
    },

//////////////////////////////////////////////////////////////////////////
// createTextView:

    createTextView: function(view) {
        // when the TextView dialog (view) closes it will set this.m_TextView to null
        if (!this.m_TextView)
            this.m_TextView = new SeqView.TextView(this);
        this.m_TextView.openDlg(view);
    },

//////////////////////////////////////////////////////////////////////////
// getPanoramaHeight:

    getPanoramaHeight: function() {
        return this.m_Panorama? this.m_Panorama.getHeight() : 0;
    },

//////////////////////////////////////////////////////////////////////////
// getPanoramaWidth:

    getPanoramaWidth: function() {
        return this.m_Panorama? this.m_Panorama.getWidth() : 0;
    },

//////////////////////////////////////////////////////////////////////////
// updateLocator:

    updateLocator: function(view) {
        if (view.isPanorama() || view.isLoading()) {
            return;
        }

        var locator = view.m_Locator;
        if (locator && this.m_Panorama) {
            if (!this.m_Panorama.isLoading()) {
                var range = view.toSeq();
                locator.setLeft( this.m_Panorama.toPix(range[0]) );
                locator.setWidth( this.m_Panorama.toPix(range[2])-2 ); // 2px if inner width (inclusive range)
                locator.setHeight( this.getPanoramaHeight()-2 );
            } else {
                this.updateLocator.defer(50,this,[view]);
            }
        }
    },

//////////////////////////////////////////////////////////////////////////
// updateViewTitles:

    updateViewTitles: function() {
        this.forEachView(function(view) { view.updateTitle(); });
    },

//////////////////////////////////////////////////////////////////////////
// findView:

    findView: function(idx) {
        for (var i = 0; i < this.m_Views.length; i++) {
            var view = this.m_Views[i];
            if (view && view.m_Idx == idx) {
                return view;
            }
        }
        return null;
    },

//////////////////////////////////////////////////////////////////////////
// forEachView:

    forEachView: function(fn, scope) {
        var array = this.m_Views;
        for(var i = 0, len = array.length; i < len; i++){
            var v = array[i];
            if (v) {
                if (fn.call(scope || v, v, i, array) === false) { return (i+1); }
            }
        }
    },

    getFlip: function() {
        return this.m_Flip;
    },

    getOrigin: function() {
        return this.m_Origin;
    },

    setFlip: function(flip, view) {
        this.m_Flip = flip;
        var view_idx = -1;
        if (typeof view != "undefined") {
            view_idx = view.m_Idx;
        }
        this.forEachView(function(view) {
            if (view.isGraphic()  &&  view.m_Idx != view_idx) {
                view.setFlipLocal(flip);
            }
        });
        this.fireEvent('strand_changed', this, view);
    },

//////////////////////////////////////////////////////////////////////////
// decodeRange:
// returns 0 - based range

    decodeRange: function(range) {
        var from = SeqView.stringToNum(range[0])-1;
        var to = 0;
        if (!from) from = 0;
        if (from >= this.m_SeqLength) from = 0;
        if (range[1] == 'zs') {
            var len = Math.floor((this.m_Panel.getInnerWidth()-10) * SeqView.MinBpp);
            to = from+len-1;
        } else {
            to = SeqView.stringToNum(range[1])-1;
        }
        if (!to) to = this.m_SeqLength;
        to = Math.min(to, this.m_SeqLength - 1);
        return [from, to];
    },

    // Keep pos or range regex in one place
    splitPosOrRange: function(s) {
        s = s.replace(/[, ]/g, '');
        return s.match(/^([-+]?\d+(?:\.\d+)?[km]?)(?:(-|to|\.\.+|:|\/|_)([-+]?\d+(?:\.\d+)?[km]?))?$/i);
    },

    // s - position or range to handle
    // options - Object with parameters
    //     allow_equal - should we allow both ends of range to be equal, false
    //     ask_user    - if position is ambiguous, can we ask user, false
    //     success     - callback for successfully parsed position
    //         pos_range - array with 1 or two elements representing pos or range
    //                     in sequence coordinates
    //         options   - options passed to handlePos
    //     failure       - callback for reporting errors
    //         error message
    //         options   - options passed to handlePos
    //     scope       - object to use as 'this' for callbacks
    handlePos: function(s, options) {
        var parts = this.splitPosOrRange(s);
        if (parts == null) {
            var hgvs = this.isHGVSExpression(s);
            var snip = s.match(/^([rs]s)([0-9]{3,})(?::.+)?$/);
            var vardb = s.match(/^([en]s)(td|v|sv)([0-9]+)(?::.+)?$/);
            if (hgvs) {
                this.handleHGVS(s, options);
            } else if (snip) {
                this.handleVariations(snip[1]+snip[2], options);
            } else if (vardb) {
                this.handleVariations(vardb[1]+vardb[2] + vardb[3], options);
            } else if (options.failure) {
                options.failure.call(options.scope, "Invalid position/range", options);
            }
            return;
        }
        var pos0 = parts[1];
        var sep = parts[2];
        var pos1 = parts[3];
        if (this.m_Origin && !this.isExplicitPosOrRange(pos0, sep, pos1)) {
            if (options.ask_user) {
                // Construct choices
                var is_range = pos1 && pos1.length > 0;
                var ambiguousItems = [];
                var lim0 = 2, lim1 = 2;
                var num0 = SeqView.stringToNum(pos0);
                var num1 = SeqView.stringToNum(pos1);
                var fc0 = pos0.charAt(0);
                if (fc0 == '+' || fc0 == '-') lim0 = 1;
                var fc1;
                if (is_range && sep !== '/') fc1 = pos1.charAt(0);
                if (fc1 == null || (fc1 == '+' || fc1 == '-')) lim1 = 1;
                var prefix = SeqView.base_url;
                for (var i = 0; i < lim0; ++i) {
                    for (var j = 0; j < lim1; ++j) {
                        var item;
                        var flipped = this.getFlip() ? "_flip" : '';
                        if (is_range) {
                            //'<div style="display:inline;top:3px;left:2px;width:12px;height:10px;clip:rect(0 12px 10px 0);background-color:red;"></div>';
                            var n0 = (1-i*2)*num0;
                            var n1 = (1-j*2)*num1;
                            if (n1 < n0) {
                                var t = n0; n0 = n1; n1 = t;
                            }
                            var imageSel;
                            if (n0 >= 0 && n1 >= 0) {
                                imageSel = "pp";
                            } else if (n0 < 0 && n1 < 0) {
                                imageSel = "mm";
                            } else if (Math.abs(n0) < Math.abs(n1)) {
                                imageSel = "pm";
                            } else {
                                imageSel = "mp";
                            }
                            if (n0 > 0) n0 = '+' + n0;
                            if (n1 > 0) n1 = '+' + n1;
                            var fullPos = n0 + ' .. ' + n1;
                            var image = '<img src="' + prefix + 'images/choice_range_' + imageSel + flipped + '.png"/>';
                            item = {boxLabel: image + '&nbsp;' + fullPos, name: 'pos', inputValue: fullPos, checked: (i == 0 && j == 0)};
                        } else {
                            var n0 = (1-i*2)*num0;
                            var imageSel = 'm';
                            if (n0 > 0) {
                                n0 = '+' + n0;
                                imageSel = 'p';
                            }
                            var image = '<img src="' + prefix + 'images/choice_pos_' + imageSel + flipped + '.png"/>';
                            item = {boxLabel: image + '&nbsp;' + n0, name: 'pos', inputValue: n0, checked: (i == 0 && j == 0)};
                        }
                        ambiguousItems.push(item);
                    }
                }
                var title = "Ambiguous " + (is_range ? "range" : "position");
                var subtitle = "Choose the correct " + (is_range ? "range" : "position");
                var dlg = new Ext.Window({
                    modal: true,
                    title: title,
                    width: 400,
//                    height:  550,
                    layout: 'form',
                    cls: 'SeqViewerApp',
                    items: [{
                        xtype: 'form',
                        items: [{
                            xtype: 'fieldset',
                            title: subtitle,
                            layout: 'anchor',
                            defaults: {
                                anchor: '100%',
                                labelStyle: 'padding-left:4px;'
                            },
                            collapsible: false,
                            items: [{
                                xtype: 'radiogroup',
                                fieldLabel: 'Single Column',
                                columns: 1,
                                items: ambiguousItems
                            }]
                        },{
                            xtype: 'label',
                            text:
                                'To avoid ambiguity, the range coordinate values must use explicit + and - signs'
                                + ' when the origin has been reset.'
                                /*
                                'Target molecule has origin reset. It makes coordinates ambiguous, please choose'
                                + ' an appropriate coordinate ' + (is_range ? "range" : "position") + ' relative to'
                                + ' the new origin. To avoid this dialog in future please use explicit + and - signs.'
                                */
                        }]
                    }],
                    buttons: [{
                        text: 'OK', scope: this,
                        handler: function() {
                            var values = dlg.items.items[0].getForm().getValues();
                            this.handlePos.call(this, values['pos'], options);
                            dlg.close();
                        }
                    },{
                        text: 'Cancel',
                        handler: function() {
                            dlg.close();
                        }
                    }]
                });
                dlg.show();
            } else {
                if (options.failure) {
                    options.failure.call(options.scope, "Explicit position/range required", options);
                }
            }
        } else {
            var beg_pos = this.convertRelativePosition(pos0);
            if (pos1 && pos1.length > 0) {
                // range is specified
                var end_pos;
                if (sep == "/") {
                    var pad = SeqView.stringToNum(pos1);
                    end_pos = beg_pos + pad;
                    beg_pos -= pad;
                } else {
                    end_pos = this.convertRelativePosition(pos1);
                    if (beg_pos > end_pos) {
                        var t = beg_pos;
                        beg_pos = end_pos;
                        end_pos = t;
                    }
                }
                if (isNaN(beg_pos) || isNaN(end_pos) || beg_pos < 0 || end_pos < 0 ||
                    (options.allow_equal ? beg_pos > end_pos : beg_pos >= end_pos)  ||
                    beg_pos >= this.m_SeqLength || end_pos >= this.m_SeqLength)
                {
                    if (options.failure) {
                        var from_pos = this.posToLocal(0);
                        var to_pos = this.posToLocal(this.m_SeqLength - 1);
                        if (to_pos < from_pos) {
                            var temp = to_pos;
                            to_pos = from_pos;
                            from_pos = temp;
                        }
                        var msg = 'Invalid range: Sequence positions should be from ' + from_pos + ' to ' + to_pos;
                        options.failure.call(options.scope, msg, options);
                    }
                } else {
                    if (options.success) {
                        options.success.call(options.scope, [beg_pos, end_pos], options);
                    }
                }
            } else {
                // single position
                if (isNaN(beg_pos) || beg_pos < 0 || beg_pos >= this.m_SeqLength) {
                    if (options.failure) {
                        var from_pos = this.posToLocal(0);
                        var to_pos = this.posToLocal(this.m_SeqLength - 1);
                        if (to_pos < from_pos) {
                            var temp = to_pos;
                            to_pos = from_pos;
                            from_pos = temp;
                        }
                        var msg = 'Invalid position: Sequence position should be from ' + from_pos + ' to ' + to_pos;
                        options.failure.call(options.scope, msg, options);
                    }
                } else {
                    if (options.success) {
                        options.success.call(options.scope, [beg_pos], options);
                    }
                }
            }
        }
    },

    // term - HGVS position to parse
    // options - Object with parameters
    //     allow_equal - should we allow both ends of range to be equal, false
    //     success     - callback for successfully parsed position
    //         pos_range - array with 1 or two elements representing pos or range
    //                     in sequence coordinates
    //         options   - options passed to handlePos
    //     failure       - callback for reporting errors
    //         error message
    //         options   - options passed to handlePos
    //     scope       - object to use as 'this' for callbacks
    handleHGVS: function(term, options) {
        var view = options ? options.view : null;
        var params = {term: term, id: this.GI, type: "hgvs"};
        if (this.m_Key && this.m_Key.length > 0)
            params.key = this.m_Key;
        var tracks = this.getActTracks();
        if (tracks)
            params.tracks = tracks;

        return [this.AjaxRequest({
            url: this.m_CGIs.FeatSearch,
            data: params,
            context: this,
            success: function(data, text, res) {
                var from_cgi = SeqView.decode(data);
                if (from_cgi.total) {
                    var feat = from_cgi.features[0];
                    var pos = feat.from;
                    var pos_range = [pos];
                    if (feat.to != pos) {
                        pos_range.push(feat.to);
                    }
                    var label = feat.label;
                    if (options && options.success) {
                        options.success.call(this, pos_range, options, label);
                    } else {
                        this.setPositionalMarker(pos_range, label);
                        if (view) {
                            view.gotoPosRange([pos], true, {from_ui: true} );
                        } else {
                            this.forEachView(function(v) {
                                if (v.isGraphic())
                                    v.gotoPosRange([pos], true, {from_ui: true});
                            });
                        }
                    }
                } else {
                    var msg = term + " not found on the sequence";
                    if (options && options.failure) {
                        options.failure.call(this, msg, options);
                    }
                }
            },
            error: function(data, text, res) {
                var msg = "Server error in parsing/searching request " + term;
                if (options && options.failure) {
                    options.failure.call(this, msg, options);
                }
            }
        })];
    },

    handleVariations: function(term, options) {
        var view = options ? options.view : null;
        var params = {term: term, id: this.GI, type: "snp"};
        if (this.m_Key && this.m_Key.length > 0)
            params.key = this.m_Key;
        var tracks = this.getActTracks();
        if (tracks)
            params.tracks = tracks;

        return [this.AjaxRequest({
            url: this.m_CGIs.FeatSearch,
            data: params,
            context: this,
            success: function(data, text, res) {
                var from_cgi = SeqView.decode(data);
                if (from_cgi.total) {
                    var snp_found = false;
                    for (var i = 0; i < from_cgi.features.length; i++) {
                        var feat = from_cgi.features[i];
                        if (feat.seqId != this.GI)
                            continue;
                        snp_found = true;
                        var pos = feat.from;
                        var pos_range = [pos];
                        if (feat.to != pos) {
                            pos_range.push(feat.to);
                        }
                        var label = feat.label;
                        if (options && options.success) {
                            options.success.call(this, pos_range, options, label);
                        } else {
                            this.setPositionalMarker(pos_range, label);
                            var tracks_changed = this.showTracks({category: "Variation"}, true, true);
                            if (view) {
                                view.gotoPosRange(pos_range, true, {from_ui: true} );
                            } else {
                                this.forEachView(function(v) {
                                    if (v.isGraphic())
                                        v.gotoPosRange(pos_range, true, {from_ui: true});
                                });
                            }
                        }
                        break;
                    }
                    // it's a valid snp but it's not annotated on this sequence
                    // so we suggest exploring dbSNP page
                    if (!snp_found) {
                        var snip = term.match(/^([rs]s)([0-9]{3,})$/);
                        var snip_url = SeqView.NCBI.host_url + '/snp/' + snip[2];
                        Ext.Msg.alert("SNP search", 'Valid SNP is not found on this sequence, please see <a target="_blank" href="'+snip_url+'">dbSNP page for '+term+'</a>');
                    }
                } else {
                    var msg = term + " not found on the sequence";
                    if (options && options.failure) {
                        options.failure.call(this, msg, options);
                    }
                }
            },
            error: function(data, text, res) {
                var msg = "Server error in parsing/searching request " + term;
                if (options && options.failure) {
                    options.failure.call(this, msg, options);
                }
            }
        })];
    },

// parsePosOrRange:
// returns an array of one or two elements, depending on input, which
//    represent a valid position or range on sequence. If there is no valid
//    position/range can be parsed, returns undefined. All input is in local
//    coordinate system - 1-based with flip and origin taken into account.
//    Output is 0-based, in sequence coordinates.

    parsePosOrRange: function(s, allow_equal) {
        s = s.replace(/[, ]/g, '');
        var parts = this.splitPosOrRange(s);
        if (parts == null) {
            return;
        }
        var part0 = parts[1];
        var sep = parts[2];
        var part1 = parts[3];
        var beg_pos = this.convertRelativePosition(part0);
        if (part1 && part1.length > 0) {
            // range is specified
            var end_pos;
            if (sep == "/") {
                var pad = SeqView.stringToNum(part1);
                end_pos = beg_pos + pad;
                beg_pos -= pad;
            } else {
                end_pos = this.convertRelativePosition(part1);
                if (this.getFlip()) {
                    var t = beg_pos;
                    beg_pos = end_pos;
                    end_pos = t;
                }
            }
            if (isNaN(beg_pos) || isNaN(end_pos) || beg_pos < 0 || end_pos < 0 ||
                (allow_equal ? beg_pos > end_pos : beg_pos >= end_pos)  ||
                beg_pos >= this.m_SeqLength || end_pos >= this.m_SeqLength)
            {
                return;
            }
            return [beg_pos, end_pos]
        } else {
            // single position
            if (isNaN(beg_pos) || beg_pos < 0 || beg_pos >= this.m_SeqLength)
                return;
            return [beg_pos];
        }
    },

//////////////////////////////////////////////////////////////////////////
// isPosOrRange:
    isPosOrRange: function(s) {
        return this.splitPosOrRange(s) != null;
    },

//////////////////////////////////////////////////////////////////////////
// isExplicitPosOrRange:
//     pos0, sep, pos1 - parts of a range split by pattern
//     returns true if numerals have a sign. e.g. -12:+24, or +35..-20
    isExplicitPosOrRange: function(pos0, sep, pos1) {
        var fc0 = pos0.charAt(0);
        var fc1;
        if (pos1 && pos1.length > 0 && sep !== '/') fc1 = pos1.charAt(0);
        return !((fc0 != '+' && fc0 != '-') || (fc1 && fc1 != '+' && fc1 != '-'));
    },

//////////////////////////////////////////////////////////////////////////
// convertRelativePosition:

    convertRelativePosition: function(pos_str) {
        var pos = SeqView.stringToNum(pos_str);
        if (!isNaN(pos))
            return this.posToGlobal(pos);
        return pos;
    },

//////////////////////////////////////////////////////////////////////////
// posToLocal: convert backend 0-based global coordinate to
//     local, taking into account strand and origin
    posToLocal: function(pos, flip) {
//        if (typeof flip == "undefined")
//            flip = this.m_Flip;
        pos -= this.m_Origin;
        if (pos >= 0) pos += 1;
//        if (flip) pos = -pos;
        return pos;
    },

//////////////////////////////////////////////////////////////////////////
// posToLocalDisplay: convert backend 0-based global coordinate to
//     local, taking into account origin, returns number with sign if
//     origin is set, so for positive numbers it will return a string
    posToLocalDisplay: function(pos, flip) {
        pos -= this.m_Origin;
        if (pos >= 0) {
            pos += 1;
            if (this.m_Origin) pos = '+' + pos;
        }
        return pos;
    },

//////////////////////////////////////////////////////////////////////////
// posToGlobal: convert 1-based coordinate relative to origin and strand
//     to global 0-based backend coordinate
    posToGlobal: function(pos) {
//        if (this.m_Flip) pos = -pos;
        if (pos > 0) pos -= 1;
        return pos + this.m_Origin;
    },

//////////////////////////////////////////////////////////////////////////
// newMarkerDlg:

    newMarkerDlg: function(view, x_pos) {
        if (!this.m_MarkersInfo) {
            this.m_MarkersInfo = new SeqView.MarkersInfo(this);
        }
        this.m_MarkersInfo.newMarkerDlg(view || this, x_pos);
    },

//////////////////////////////////////////////////////////////////////////
// showMarkersDlg:

    showMarkersDlg: function( view ){
        if( !this.m_MarkersInfo ){
            this.m_MarkersInfo = new SeqView.MarkersInfo( this );
        }
        this.m_MarkersInfo.showDlg( view );
    },

//////////////////////////////////////////////////////////////////////////
// updateMarkersSize:

    updateMarkersSize: function(view) {
        if (this.m_MarkersInfo) {
            this.m_MarkersInfo.updateMarkersSize(view);
        }
    },

//////////////////////////////////////////////////////////////////////////
// hasMarkers:

    hasMarkers: function() {
        return this.m_MarkersInfo && this.m_MarkersInfo.hasMarkers();
    },

//////////////////////////////////////////////////////////////////////////
// getMarkersInfo:

    getMarkersInfo: function() {
        return this.m_MarkersInfo;
    },

//////////////////////////////////////////////////////////////////////////
// updateMarkersPos:

    updateMarkersPos: function(view) {
        if (this.m_MarkersInfo) {
            this.m_MarkersInfo.updateMarkersPos(view);
        }
    },

//////////////////////////////////////////////////////////////////////////
// forEachMarker:

    forEachMarker: function(fn, scope) {
        if (this.m_MarkersInfo) {
            this.m_MarkersInfo.forEachMarker(fn,scope);
        }
    },

//////////////////////////////////////////////////////////////////////////
// findMarker:

    findMarker: function(m_name) {
        if (this.m_MarkersInfo) {
            return this.m_MarkersInfo.findMarker(m_name);
        }
        return null;
    },

//////////////////////////////////////////////////////////////////////////
// addMarker:

    addMarker: function(marker_data) {
        if (!this.m_MarkersInfo) {
            this.m_MarkersInfo = new SeqView.MarkersInfo(this);

        }
        this.m_MarkersInfo.addMarker(marker_data);
    },

//////////////////////////////////////////////////////////////////////////
// addMarkerByData:

    addMarkerByData: function(marker_data) {
        if (!this.m_MarkersInfo) {
            this.m_MarkersInfo = new SeqView.MarkersInfo(this);
        }
        this.m_MarkersInfo.addMarkerByData(marker_data);
    },

//////////////////////////////////////////////////////////////////////////
// scrollMarkers:

    scrollMarkers: function(view, delta) {
        if (this.m_MarkersInfo) {
            this.m_MarkersInfo.scrollMarkers(view,delta);
        }
    },

//////////////////////////////////////////////////////////////////////////
// updateReflections:

    updateReflections: function() {
        if( this.m_Reflections ){
            this.m_Reflections.updateAll();
        }
   },

//////////////////////////////////////////////////////////////////////////
// scrollReflections:

    scrollReflections: function(view, delta) {
        if (this.m_Reflections) {
            this.m_Reflections.scrollPix(view,delta);
        }
        //this.reCreateReflections();
   },

//////////////////////////////////////////////////////////////////////////
// reCreateReflections:

    reCreateReflections: function() {
        return; // temporary disabled
        if (!this.m_Reflections)
            this.m_Reflections = new SeqView.ReflectionCont(this);
        this.m_Reflections.reCreate();
    },


//////////////////////////////////////////////////////////////////////////
// reloadAllViews:

    reloadAllViews: function(options) {
        this.forEachView(function(view) { view.refresh(options); });
    },

//////////////////////////////////////////////////////////////////////////
// showOriginDlg:

    showOriginDlg: function(pos) {
        Ext.MessageBox.prompt('Set Origin', 'Please enter new origin:', function(btn, text) {
            if (btn!='ok'  || text.length==0) return;
            var position = 0;
            var bad_pos = !SeqView.IsNumeric(text);
            if (!bad_pos) {
                position = SeqView.stringToNum(text);
                if (position > this.m_SeqLength) {
                    bad_pos = true;
                }
            }
            if (bad_pos) {
                Ext.MessageBox.show({title: 'Set Origin',msg: 'Invalid sequence origin.',
                                     buttons: Ext.MessageBox.OK,icon:Ext.MessageBox.ERROR});
                return;
            }
            position -= 1;
            if (this.m_Origin == position)
                return;
            this.m_Origin = position;
            if (this.m_Origin < 0) this.m_Origin = 0;
            // reload all views
            this.reloadAllViews();
            this.fireEvent('origin_changed', this);
        }, this, false, pos ? pos+1 : this.m_Origin+1);
    },

    setOrigin: function(view, x_pos) {
        var pix = x_pos - view.m_ScrollPix;
        var seq_pos = view.pix2Seq(pix);
        this.showOriginDlg(seq_pos);
    },

    clearOrigin: function() {
        Ext.MessageBox.confirm('Confirm', 'Reset Sequence Origin?', function(btn) {
            if (btn!='yes' || this.m_Origin == 0) return;
            this.m_Origin = 0;
            // reload all views
            this.reloadAllViews();
            this.fireEvent('origin_changed', this);
        }, this);
    },




//////////////////////////////////////////////////////////////////////////
// loadExtraData
//   callback object with success and/or failure defined

    loadExtraData: function(callback) {
        this.load_params = this.load_params || {};
        if (!this.m_userData.length) {
            this.loadDataSuccess(callback);
            return;
        }
        
        if (typeof this.m_AssmContext == 'undefined') {
            this.m_AssmContext = '';
            if (this.GI && this.GI.indexOf("lcl|") !=0) {
                var options = { context: this,
                    url: this.m_CGIs.Config + '?notrackconfig=true&id=' + this.GI,
                    success: function(data, txt, rq) {
                        if (data.job_status) {
                            var st = data.job_status;
                            if (st == 'submitted' || st == 'running' || st == 'pending') {
                                options.url = this.m_CGIs.Config + '?job_key=' + data.job_id;
                                SeqView.App.simpleAjaxRequest.defer(1000, this, [options]);
                                return;
                            }
                       }
                       if (data.SeqInfo) this.m_AssmContext = data.SeqInfo.assm_context;
                       this.loadExtraData(callback);
                    },
                    error: function() { this.loadExtraData(callback); }
                };
//                options.url += '&delaytest=30';
                SeqView.App.simpleAjaxRequest(options);
                return;
            }
        }

        var config = {assm_acc: this.m_AssmContext};//, data_action:'uploading', ret_prj_key: 'true' };
        if (this.GI) config['accession'] = this.GI;
        if (this.m_Key) { 
            config['prj_key'] = this.m_Key;
        } else if (this.load_params.key) {
            config['prj_key'] = this.load_params.key;
        }
        var data_item = this.m_userData.shift();
        if (data_item[0] == 'rkey') {// Fetch long RID with filters from NetCache key
            var params = {data_action: 'downloading', format: 'rids', key: data_item[1], fmt: "text/plain"};
            var processResponse = function(data) {
                    if (data.statusText == 'OK') this.m_userData.unshift(['rid', data.responseText]);
                    else  this.m_userTrackNames.shift(); // Keep name array in sync
                    this.loadExtraData(callback);
            }
            this.AjaxRequest({url: this.m_CGIs.NetCache, data: params, context: this,
                success: processResponse,
                error: processResponse});
        } else {
            config.track_name = this.m_userTrackNames.shift();
            if (config.track_name) delete config.track_name;
            switch (data_item[0]) {
                case 'rid': config.blast = {rid: data_item[1], link_related_hits: this.m_FindCompartments};
                    this.load_params.rid_loaded = true; // Mark that we loaded RID
                    break;
                case 'data':
                    config.data = data_item[1];
                    config.file_format = 'asn text';
                    break;
                case 'url_reload': config.check_cs = true; // no break;
                case 'url': config.dataURL = data_item[1]; break;
            }
            var msg = 'Uploading your data';
            if (this.m_AssmContext) {
                msg += " on assembly " + this.m_AssmContext;
            }
            msg += ', please wait...'; 
            this.showMessage(msg);
            this.m_Panel.items.items[0].getEl().mask('Uploading \"' + data_item[0] + '\"', 'x-mask-loading');
//        config.delaytest = 40;
            var app = this;
            try {
                var uploaderUUD = new UUD.FileUploader(config);
                var promise = uploaderUUD.getPromise();
                promise.fail(function() {
                    app.m_Panel.items.items[0].getEl().unmask();
                    var errMsg = this.getErrors();
                    app.showMessage(errMsg, true);
                    var fbText = 'SViewer initial parameters: ' + app.m_AllViewParams + '\nError message: ' + this.getErrors();
                    Ext.MessageBox.show({title: 'User data loading error',
                        msg: errMsg,
                        buttons: {no: 'Continue', yes: 'Feedback', cancel: 'Cancel'},
                        icon: Ext.MessageBox.WARNING,
                        fn: function(btn) {
                            switch (btn) {
                                case 'yes': app.showFeedbackDlg(fbText, document.location.href); // "break" is missed to continue data loading
                                case 'no': app.loadExtraData(callback); break;
                            }
                        }});               
                });
                promise.done(function(tlist, dkey) {
                    if (app.load_params.rid_loaded && !app.GI) app.initRID(this.getMetadata());
                    app.addKey(dkey);
                    var tracks = this.getTracks();
                    if (tracks) Ext.each(tracks, function() { app.addUploadedTrackID(this); });
                    var cookie_name = SeqView.Cookies.UserDataCookieName;
                    if (cookie_name === SeqView.Cookies.UserDataCookieNameBase) {
                        cookie_name += (app.m_AppName ? ('-' + app.m_AppName) : '');
                    }
                    SeqView.SessionData.set(cookie_name, app.m_Key);//save the key into a session cookie
                    var msg = 'Data uploaded';
                    if (app.m_AssmContext) 
                        msg += " on assembly " + app.m_AssmContext;
                    app.showMessage(msg);
                    app.loadExtraData(callback);
                });
                var currTask = 'Uploading your data'
                promise.progress(function(progress) {
                    var task = progress.current_task;
                    if (task == "" || task == 'pending' || task == currTask) return;
                    app.showMessage(currTask = task);
                });
                uploaderUUD.upload();
            } catch(e) { app.showMessage('Unable to upload data: ' + e.message, true); } 
        }
    },
    
    addUploadedTrackID: function(track) {
        var id = track.id || track.GetTMSId();
        this.uploadedIDs = this.uploadedIDs || [];
        var obj = this.uploadedIDs.filter(function ( obj ) {
            return obj.id === id;
        })[0];
        if (obj === undefined)
            this.uploadedIDs.push(track);
        //if (this.uploadedIDs.indexOf(id) == -1) this.uploadedIDs.push(id);
    },

    showMessage: function(msg, errorFlag) {
        var msg_field = Ext.getCmp((errorFlag ? 'sv-uplerr' : 'sv-uplmsg') + this.m_DivId);
        if (msg_field) {
            msg_field.show();
            msg_field.update(msg);
        }
    },

    addKey: function(key) {
        if (typeof key == 'undefined') return;
        if (!this.m_Key || this.m_Key.length == 0) this.m_Key = key;
        else
            if (this.m_Key.search(key) == -1) this.m_Key += '|' + key;
    },

    initRID: function(from_cgi) {
        if (from_cgi['blast_query'] === undefined) return; // Can't do anything
        var blast_query_list = from_cgi['blast_query'];
        var blast_query = {};
        for (var i = 0; i < blast_query_list.length; i++) {
            var kv = blast_query_list[i];
            blast_query[kv.key] = kv.value;
        }
        this.GI = blast_query['id'];
        if (!this.m_QueryRange) {
            var beg = blast_query['beg'];
            var end = blast_query['end'];
            var querybeg = blast_query['querybeg'];
            var queryend = blast_query['queryend'];
            if (querybeg !== undefined  &&  queryend !== undefined) {
                // Convert to numbers
                querybeg = querybeg - 0;
                queryend = queryend - 0;

                // Adjust viewrange, add special marker to show query if requested
                beg = beg !== undefined ? Math.min(beg, querybeg) : querybeg;
                end = end !== undefined ? Math.min(end, queryend) : queryend;
                if (this.m_ShowQuery) {
                     this.m_Markers.push([ [querybeg, queryend], "Query", SeqView.MarkerFlags.SystemLock | SeqView.MarkerFlags.Hollow, "red"]);
                }
            }
            if (beg !== undefined  &&  end !== undefined) {
                var overhang = 0.15 * (end - beg);
                beg = Math.max(0, beg - overhang);
                end += overhang;
                beg = Math.round(beg);
                end = Math.round(end);
                this.m_ViewRanges = [ beg + ':' + end ];
            }
        }
    },

//////////////////////////////////////////////////////////////////////////
// onSyncAlignView:

    onSyncAlignView: function(view) {
        for (var i = 0; i < this.m_Views.length; ++i) {
            aview = this.m_Views[i];
            if (aview && aview.isAlignment() ) {
                aview.loadImage(view.m_VisFromSeq, view.m_VisLenSeq);
                break;
            }
        }
    },

    getGraphicViews: function() {
        var views = []
        this.forEachView(function(view) {
            if (view.isGraphic())
                views.push(view);
        });
        return views;
    },

    AjaxRequest: function(cfg){

        if( !this.m_AjaxTrans ) this.m_AjaxTrans = [];

        cfg.callback = cfg.callback || function(arg) {};
        cfg.params = cfg.params || {};

        if( this.m_AppName && this.m_AppName.length > 0 ){
            cfg.params.appname = this.m_AppName;
        }

        var trans = this.m_AjaxTrans;

        var prefunction = function(opts, succsess, res) {
            if( opts.params.transId ){
                trans.remove( opts.params.transId );
                delete opts.params.transId;
            }
        }
        cfg.callback = cfg.callback.createInterceptor( prefunction );

        var transId = SeqView.App.simpleAjaxRequest(cfg);
        if( transId ){
            cfg.params.transId = transId;
            trans.push( transId );
            return transId;
        }
    },

    getCustomToolTipTools: function(selection) {
        if (this.m_CustomSelectionHandler)
            return this.m_CustomSelectionHandler.getToolTipTools(selection);
        return null;
    },
    setCustomSelectionHandler: function(handler) {
        this.m_CustomSelectionHandler = handler;
    },

    addCustomFeatureFlags: function(cfg) {
        if (this.m_CustomSelectionHandler) {
            this.m_CustomSelectionHandler.addCustomFeatureFlags(cfg);
        }
    },

    setTooltipPreprocessor: function(callback) {
        if (typeof callback === 'function') this.m_preprocessorTT = callback;
        else delete this.m_preprocessorTT;
    },

    watchdogStart: function(url, job_id, params) {
        this.watchdogStop();
        this.m_WatchUrl = url;
        this.m_WatchJobId = job_id;
        this.m_WatchJobParams = params;
        this.m_WatchTimeoutId = this.watchdogReport.defer(90000, this, ['No response']);
    },

    watchdogStop: function() {
        if (this.m_WatchTimeoutId ){
            clearTimeout(this.m_WatchTimeoutId);
            this.m_WatchTimeoutId = null;
        }
    },

    watchdogReport: function(reason) {
        this.watchdogStop();
        this.AjaxRequest({
            url: this.m_CGIs.Watchdog,
            data: {
                reason: reason,
                requrl: this.m_WatchUrl,
                reqparams: this.m_WatchJobParams,
                jobid: this.m_WatchJobId
            }
        });
    }

});

// Portal integration function. It is called then Portal needs to know current
// sequence viewer position.
SeqView.PortalSeqGraphicsInfo = function() {
    var params = "from=&to=&itemid=&strand=";
    if(SeqView.App) {
        var apps = SeqView.App.getApps();
        if (apps && apps.length == 1) {
            var app = apps[0];
            var views = app.getGraphicViews();
            if (views && views.length == 1) {
                var view = views[0];
                if (view.m_VisFromSeq >= 0 && view.m_VisLenSeq && view.m_VisLenSeq > 0) {
                    params = 'from='+(view.m_VisFromSeq+1)+'&to='+(view.m_VisFromSeq+view.m_VisLenSeq);
                } else {
                    params = 'from=&to=';
                }
                params += '&itemid=';
                if (app.m_ItemID) {
                    params += app.m_ItemID;
                }
                if (view.canFlip()) {
                    if (view.getFlip()) {
                        params += '&strand=true';
                    } else {
                        params += '&strand=false';
                    }
                } else {
                    params += '&strand=';
                }
            }
        }
    }
    return params;
};

/*  $Id: sviewapp_more.js 34136 2015-11-09 22:16:16Z borodine $
 * ===========================================================================
 *
 *                            PUBLIC DOMAIN NOTICE
 *               National Center for Biotechnology Information
 *
 *  This software/database is a "United States Government Work" under the
 *  terms of the United States Copyright Act.  It was written as part of
 *  the author's official duties as a United States Government employee and
 *  thus cannot be copyrighted.  This software/database is freely available
 *  to the public for use. The National Library of Medicine and the U.S.
 *  Government have not placed any restriction on its use or reproduction.
 *
 *  Although all reasonable efforts have been taken to ensure the accuracy
 *  and reliability of the software and data, the NLM and the U.S.
 *  Government do not and cannot warrant the performance or results that
 *  may be obtained by using this software or data. The NLM and the U.S.
 *  Government disclaim all warranties, express or implied, including
 *  warranties of performance, merchantability or fitness for any particular
 *  purpose.
 *
 *  Please cite the author in any work or product based on this material.
 *
 * ===========================================================================
 *
 * Authors:  Vlad Lebedev, Maxim Didenko, Victor Joukov
 *
 * File Description:
 *
 */

Ext.apply(SeqView.App.prototype, {

    showLinkURLDlg: function () {
        this.getLinkToThisPageURL(null, null, function (the_link_url, tkeyFlag) {
            this.resizeIFrame(400);
            var svParams = the_link_url.substr(the_link_url.indexOf('?') + 1);
            if (svParams.indexOf('report=graph') == 0) svParams = 'id=' + this.GI + svParams.substr(svParams.indexOf('&'));
            var template = '<iframe id="sv@iframe" width="' + this.m_Views[0].m_Width + '" src="' + SeqView.base_url.replace(/http:/, 'https:')
                      + 'embedded_iframe.html?iframe=sv@iframe&' + svParams
                      + '" onload="resize_sv@iframe();">\n</iframe>\n<script type="text/javascript">function resize_sv@iframe(){'
                      + 'var resize=function(e){if(e.origin=="https://'
                      + document.domain + '" && !isNaN(e.data))document.getElementById("sv@iframe").height=parseInt(e.data);};'
                      + 'if (!window.addEventListener) window.attachEvent("onmessage",resize,false);else  window.addEventListener("message",resize,false);}\n</script>';

            var showEmbedCode = function (uname) {
                if (!uname || uname.length < 1) uname = 'sv_iframe';
                var comp = Ext.getCmp('SV_embed_code');
                comp.setValue(template.replace(/sv@iframe/g, uname));
            }
            var app = this;
            var linkDlg = new Ext.Window({
                layout: 'form',
                modal: true,
                title: 'Link To This Page',
                width: 700, autoHeight: true,
                constrain: true,
                cls: 'SeqViewerApp',
                listeners: {
                    'beforeshow': function (qt) {
                        SeqView.makeTinyURL(the_link_url, function (res) {
                            var uname = '';
                            if (res.id) {
                                Ext.getCmp('the_tinyURL_link').setValue(res.id);
                                var parts = res.id.split('/');
                                uname = parts[parts.length - 1].trim();
                            }
                            showEmbedCode(uname);
                        }
                        );
                    },
                    'show': function () {
                        if (this.m_Key && this.m_Key.length > 0) {
                            Ext.Msg.show({
                                title: 'Warning',
                                msg: "This page contains a link to the user loaded data " +
                                     "which is kept <br/>inside a temporary storage and will not be available in approximately 1-2 months.",
                                icon: Ext.Msg.WARNING,
                                buttons: Ext.Msg.OK
                            });
                        }
                        if (tkeyFlag) {
                            Ext.Msg.show({
                                title: 'Warning',
                                msg: "The tracks configuration string for this link is too long and it has been saved<br/>" +
                                     "into a temporary storage. It will be kept there for 3 months.",
                                icon: Ext.Msg.WARNING,
                                buttons: Ext.Msg.OK
                            });
                        }

                    },
                    scope: this
                },
                resizable: true,
                resizeHandles: 'ew',
                closeAction: 'close',
                plain: true,
                items: [{
                    layout: 'form',
                    bodyStyle: 'padding:5px;',
                    labelWidth: 140,
                    frame: true,
                    labelAlign: 'right',
                    items: [
                        { xtype: 'textarea', height: 115, fieldLabel: 'Paste link in email or IM', allowBlank: true, width: '97%', value: the_link_url, name: 'the_link' },
                        { xtype: 'textfield', fieldLabel: 'Tiny URL', id: 'the_tinyURL_link', allowBlank: true, width: '97%', emptyText: 'Loading...', value: '', name: 'the_tinyURL' },
                        { xtype: 'textarea', height: 115, fieldLabel: 'Embed code', id: 'SV_embed_code', allowBlank: true, width: '97%', emptyText: 'Loading...', value: '', name: 'embed_code' }
                    ]
                }],
                buttons: [{ text: 'Close', handler: function () { linkDlg.close(); app.resizeIFrame(); } }]
            });
            linkDlg.show();
        });
    },


    getLinkToThisPageURL: function (mode, tracks, callback) {
        tracks = tracks || SeqView.TM.tracksArrayToString(this.getActiveTracks(true), true, true);

        if (tracks.length < 1500)
            this._getLinkToThisPageURL(mode, tracks, callback);
        else {
            var params = { data_action: 'uploading', input_form: 'tracks', tracks: tracks };
            this.AjaxRequest({ url: this.m_CGIs.SvDataUpload, data: params, context: this,
                success: function (data, text, res) {
                    var from_cgi = SeqView.decode(data);
                    this._getLinkToThisPageURL(mode, from_cgi.success ? from_cgi.key : tracks, callback);
                },
                error: function (data) {
                    this._getLinkToThisPageURL(mode, tracks, callback);
                }
            });
        }
    },

    _getLinkToThisPageURL: function (mode, tracks_key, callback) {
        var the_link = '';
        tracks_key = tracks_key || '';
        var tkeyFlag = tracks_key.charAt(0) !== '[';

        var info = this.m_Config.SeqInfo;
        if ((this.m_Portal || mode == 'portal') && mode != 'full' && info.gi) {
            var db = info.acc_type == 'DNA' ? 'nuccore' : 'protein';
            the_link = SeqView.NCBI.host_url + '/' + db + '/' + info.gi + '?report=graph';
        } else {
            the_link += SeqView.base_url.replace(/http:/, 'https:') + '?id=' + this.GI;
         }
        if (this.m_Origin != 0) the_link += '&origin=' + this.m_Origin;
        if (this.m_NAA) the_link += '&naa=' + this.m_NAA;
        if (this.m_SRZ) the_link += '&srz=' + this.m_SRZ;
        if (this.m_BamPath) the_link += '&bam_path=' + this.m_BamPath;
        if (this.m_DepthLimit) the_link += '&depthlimit=' + this.m_DepthLimit;
        if (this.m_SnpFilter) the_link += '&snp_filter=' + this.m_SnpFilter;
        if (tracks_key) the_link += (tkeyFlag ? '&tkey=' : '&tracks=') + tracks_key;
        if (this.m_Key) the_link += '&key=' + this.m_Key;
        if (this.m_AppName) the_link += '&appname=' + this.m_AppName;
        // add markers
        if (this.m_MarkersInfo)
            the_link += this.m_MarkersInfo.getMarkersURL();
        if (this.m_ViewerContext)
            the_link += '&viewer_context=' + this.m_ViewerContext;
        if (this.m_AppContext)
            the_link += '&app_context=' + this.m_AppContext;
        if (this.m_AssmContext)
            the_link += '&assm_context=' + this.m_AssmContext;
        // add views
        var view = '&v';
        var color = '&c';
        var slimMode = '&slim';
        var the_theme = '&theme=';
        var select = '&select';
        this.forEachView(function (v) {
            if (!v.isGraphic()) return;
            if (v.m_UrlFrom && v.m_UrlTo) { // if we have presise positions from URL, use them. Otherwise - calculate from visible range
                view += ',' + v.m_UrlFrom + ':' + v.m_UrlTo;
            } else {
                view += ',' + (v.m_VisFromSeq + 1) + ':' + (v.m_VisFromSeq + v.m_VisLenSeq);
            }
            color += ',' + v.m_Color;
            slimMode += ',' + (0 + v.m_slimMode);
            select += ',' + (v.m_SelectedSig ? v.m_SelectedSig : 'null');
        });

        var options = this.m_Config.Options;
        if (options) {
            Ext.each(['color', 'label', 'decor', 'spacing'], function (attr) {
                the_link += '&' + attr + '=';
                idx = options.controls[attr].indexOf(options['curr_' + attr]);
                the_link += (idx == -1 ? 0 : idx);
            });
        }
        the_link += (view.replace(/,/, '=') + color.replace(/,/, '=') + '&gflip=' + this.m_Flip
                 + select.replace(/,/, '=') + slimMode.replace(/,/, '='));

        if (this.m_TextView) the_link += this.m_TextView.getURL();

        if (this.m_SearchDlg && this.m_SearchDlg.isVisible()) {
            var view = null;
            this.forEachView(function (v) { if (!view && v.isGraphic()) view = v; });
            if (view) {
                var comp = Ext.getCmp('sv-goto-box_' + view.m_Idx);
                var searchTerm = null;
                if (comp) searchTerm = comp.getValue();
                if (comp && searchTerm) the_link += '&search=' +
                    searchTerm.replace(/&/g, '%26');
            }
        }

        if (callback) callback.call(this, the_link, tkeyFlag);
        else window.open(the_link);
    },

    //////////////////////////////////////////////////////////////////////////
    // gotoAndSearch - if term is HGVS expression, SNP, or position - find the
    // position requested. If it's search term - conduct the search.
    // parameters:
    // term - term to search or go to
    // options - Object with following possible fields
    //     view - if set, update this particular view, otherwise all views
    //     success - if set, report results through this callback,
    //               if not for position set it to the view, or all views if
    //               view is not specified. Set positional marker.
    //               For search, show search dialog.
    //         results - object of the following composition
    //             type - "hgvs",
    //             total - number of features found
    //             features - array of objects
    //                 from - first feature coordinate
    //                 to   - second feature coordinate
    //                 gi   - gi feture found on
    //                 label - feature label
    //         options - options Object passed to gotoAndSearch
    //     failure - if set, report errors through this callback
    //               if not, shows Message Boxes
    //         err_msg - error message text
    //         options - options Object passed to gotoAndSearch
    // returns array with deferred ids
    gotoAndSearch: function (term, options) {
        if (!term) {
            return;
        }
        term = Ext.util.Format.trim(term);
        if (!term.length) {
            return;
        }
        if (!options) {
            // Guard against empty options
            options = {};
        }
        // Add view and scope to callback so it works with parseAndGotoPosition
        if (!options.scope) options.scope = this;
        var hgvs = this.isHGVSExpression(term);
        var snip = term.match(/^([rs]s)([0-9]{3,})(?::.+)?$/);
        var vardb = term.match(/^([en]s)(td|v|sv)([0-9]+)(?::.+)?$/);
        if (hgvs) {
            return this.handleHGVS(term, options);
        } else if (snip) {
            return this.handleVariations(snip[1] + snip[2], options);
        } else if (vardb) {
            return this.handleVariations(vardb[1] + vardb[2] + vardb[3], options);
        } else if (this.isPosOrRange(term)) {
            return this.parseAndGotoPosition(term, options);
        } else {
            if (!options.success) {
                this.openSearchDlg(term, options.view);
                return [];
            } else {
                return this.startSearch(term, options);
            }
        }
    },


    isHGVSExpression: function (term) {
        return term.match(/^(?:([^:]+):)?([cgmnrp])\.(.+)$/);
    },

    //////////////////////////////////////////////////////////////////////////
    // setPositionalMarker - set a marker with a special property: initially locked
    // when unlocked it changes its title to default "Marker #"
    setPositionalMarker: function (pos_range, name) {
        if (!this.getMarkersInfo().findMarkerByName(name)
            && !(pos_range.length == 1 && this.getMarkersInfo().findMarkerByPos(pos_range[0]))
        ) {
            this.getMarkersInfo().addMarker(pos_range, name,
                SeqView.MarkerFlags.PositionTitle | SeqView.MarkerFlags.UserLock);
        }
    },




    //
    // term - position or range to parse and goto
    // options - Object with parameters:
    //     range_only - should we accept strictly range or position is OK, false
    //     view       - goto this position in a specific view, otherwise - globally
    //     success    - do not go to position, report successfully parsed position to this callback
    //         results in 'features' format
    //         options - options object for parseAndGotoPosition
    //     failure     - do not report error to user, use this callback
    //         error message
    //         options - options object for parseAndGotoPosition
    //     scope      - object to use as 'this' for callbacks
    parseAndGotoPosition: function (term, options) {
        term = term.replace(/[, ]/g, '');
        this.handlePos(term, {
            // pass parameters from our options
            range_only: options.range_only,
            view: options.view,
            nested_success: options.success,
            nested_failure: options.failure,
            // handlePos parameters
            ask_user: true,
            success: function (pos_range, options) {
                if (options.range_only && pos_range.length !== 2) {
                    options.failure.call(options.scope, "Range required", options);
                    return;
                }
                if (options.nested_callback) {
                    var pos = pos_range[0];
                    var pos_to = pos;
                    if (pos_range.length > 1) pos_to = pos_range[1];
                    var res = { type: "pos", total: 1,
                        features: [{ from: pos,
                            to: pos_to,
                            gi: options.app.m_ViewParams.gi,
                            label: term
                        }]
                    };
                    options.nested_callback.call(options.scope, res, options);
                } else {
                    if (pos_range.length == 1) {
                        options.app.setPositionalMarker(pos_range, term);
                    }
                    if (options.view) {
                        options.view.gotoPosRange(pos_range, true, { from_ui: true });
                    } else {
                        options.app.forEachView(function (v) {
                            if (v.isGraphic()) v.gotoPosRange(pos_range, true, { from_ui: true });
                        });
                    }
                }
            },
            failure: function (err_msg, options) {
                if (options.nested_failure) {
                    options.nested_failure.call(options.scope, err_msg, options);
                } else {
                    Ext.MessageBox.alert('Error', err_msg);
                }
            },
            scope: options.scope ? options.scope : this,
            app: this
        });
        return [];
    },

    checkSearchStatus: function (data, request_type, request_term, options) {
        var from_cgi = SeqView.decode(data);
        if (from_cgi.job_status) {
            var st = from_cgi.job_status;
            if (st == 'submitted' || st == 'running' || st == 'pending') {
                SeqView.App.simpleAjaxRequest.defer(2000, this, [{
                    url: this.m_CGIs.FeatSearch + '?job_key=' + from_cgi.job_id,
                    context: this,
                    success: function (data, text, res) {
                        this.checkSearchStatus(data, request_type, request_term, options);
                    },
                    error: function (data, text, res) {
                        this.reportSearchFailure(request_type, request_term, options);
                    }
                }]);
                return;
            }
        }
        from_cgi.type = request_type;
        if (options.success)
            options.success.call(this, from_cgi);

    },
    reportSearchFailure: function (request_type, request_term, options) {
        var msg = "Server error in searching request " + request_term;
        if (options.failure)
            options.failure.call(this, msg);
    },

    startSearch: function (term, options) {
        var seq_type = 'nucleotide';
        if (this.m_ViewParams['acc_type'] == 'protein') {
            seq_type = 'protein';
        }
        var data_key = (this.m_App.m_Key && this.m_App.m_Key.length > 0) ? this.m_App.m_Key : '';
        var data_tracks = this.m_App.getActTracks();
        if (!data_tracks)
            data_tracks = '';

        var requests = [
            { url: this.m_CGIs.FeatSearch,
                params: { term: term, type: 'feature', id: this.GI, whole: 1, limit: 1000000, key: data_key, tracks: data_tracks }
            },
            { url: this.m_CGIs.FeatSearch,
                params: { term: term, type: 'component', id: this.GI, whole: 1, limit: 1000000, key: data_key }
            },
            { url: this.m_CGIs.FeatSearch,
                params: { term: term, type: seq_type, id: this.GI, whole: 1, limit: 1000000, key: data_key }
            }
        ];
        var res = [];

        for (var i = 0, l = requests.length; i < l; i++) {
            res.push((function (that, type, term) {
                return that.AjaxRequest({
                    url: requests[i].url,
                    data: requests[i].params,
                    context: that,
                    success: function (data, text, res) {
                        that.checkSearchStatus(data, type, term, options);
                    },
                    error: function (data, text, res) {
                        that.reportSearchFailure(type, term, options);
                    }
                });
            })(this, requests[i].params.type, requests[i].params.term));
        }
        return res;
    },

    /// MRU search pattern list support


    spsRecId: 100,
    searchPatternData: [],
    maxNumOfSearchPatterns: 20,
    searchPatternStore: function () {
        var rt = Ext.data.Record.create([
            { name: 'pattern' }
        ]);
        var store = new Ext.data.Store({
            // explicitly create reader
            reader: new Ext.data.ArrayReader(
                {
                    idIndex: 0  // id for each record will be the first element
                },
                rt // recordType
            )
        });

        /*
        var defaultData = { pattern: 'org[homo]' };
        
        var r = new store.recordType( defaultData, ++this.spsRecId ); // create new record
        store.insert( 0, r ); 
        */

        return store;
    } (),

    loadSearchPatternStore: function () {

        //var mrulist = Ext.util.JSON.encode( { pattern: 'hbb' } );
        //mrulist = Ext.urlEncode( {list:mrulist} );
        var ext_session = Ext.util.Cookies.get("ncbi_sid");
        var session = SeqView.SessionData.get("ncbi_sid");
        if (!session) {
            session = '';
        }
        var appname = this.m_AppName;
        if (!appname) {
            appname = '';
        }

        var app = this;
        this.AjaxRequest({
            url: this.m_CGIs.SearchMru,
            context: this,
            data: {
                session: session,
                appname: appname,
                seqid: this.GI,
                oper: 'load'
            },
            success: function (data, text, response) {
                var from_cgi = SeqView.decode(data);

                if (from_cgi.mrulist) {
                    var list = Ext.urlDecode(from_cgi.mrulist);
                    if (list.list) {
                        var mrulist = list.list;
                        var recdata = Ext.util.JSON.decode(list.list);

                        app.searchPatternData = recdata;

                        app.searchPatternStore.removeAll();
                        Ext.each(app.searchPatternData, function (data, x) {
                            var r = new app.searchPatternStore.recordType(data, ++app.spsRecId); // create new record
                            app.searchPatternStore.insert(0, r);
                        });
                    }
                }
            },
            error: function (data, text, response) { }
        });

    },

    saveSearchPatternStore: function () {
        var recdata = this.searchPatternData;
        while (recdata.length > this.maxNumOfSearchPatterns) {
            recdata.shift();
        }

        var mrulist = Ext.util.JSON.encode(recdata);
        mrulist = Ext.urlEncode({ list: mrulist });

        var ext_session = Ext.util.Cookies.get("ncbi_sid");
        var session = SeqView.SessionData.get("ncbi_sid");
        if (!session) {
            session = '';
        }
        var appname = this.m_AppName;
        if (!appname) {
            appname = '';
        }

        this.AjaxRequest({
            url: this.m_CGIs.SearchMru,
            context: this,
            data: {
                session: session,
                seqid: this.GI,
                appname: appname,
                oper: 'save',
                mrulist: mrulist
            },
            success: function (data, text, response) {
                var from_cgi = SeqView.decode(data);
                if (from_cgi.mrulist) {
                    var mrulist = Ext.urlDecode(from_cgi.mrulist);
                    var mmm = mrulist;
                }
            },
            error: function (data, text, response) { }
        });


    },

    showSearchParamsDlg: function (view) {
        var titleText = 'Find on Sequence';
        var msgText = 'Enter sequence position or range (possible range formats are '
            + '10k-20k, -20--10, -10k:-5, 5 to 515, -1m..1m)<br/><br/>'
            + 'Or enter name of feature, component, HGVS, SNP rs id, '
            + 'or sequence (nucleotide regexp with IUPAC equivalents, PROSITE patterns):<br/>'
        ;
        var dlg, combo;
        var btns = [];
        var buttons = {};

        var app = this;
        var handleButton = function (button) {
            buttons[button].blur();
            if (dlg.isVisible()) {
                dlg.hide();
                var term = '';
                if (term == '' && combo.el && combo.el.dom) {
                    term = combo.el.dom.value;
                }

                if (button != 'ok' || term.length == 0) return;

                var ix = -1;
                //indexOf( { pattern: term } );
                for (var i = 0, j = app.searchPatternData.length; i < j; i++) {
                    if (app.searchPatternData[i].pattern === term) {
                        ix = i;
                        break;
                    }
                }
                if (ix == -1) {
                    var data = { pattern: term };

                    app.searchPatternData[app.searchPatternData.length] = data;
                    app.searchPatternStore.removeAll();
                    Ext.each(app.searchPatternData, function (data, x) {
                        var r = new app.searchPatternStore.recordType(data, ++app.spsRecId); // create new record
                        app.searchPatternStore.insert(0, r);
                    });

                    app.saveSearchPatternStore();
                }

                app.gotoAndSearch(term, { view: view });
                //setting value to the sv-goto-box to the same value (may be needed later on when browser width gets > 900)
                var gotoBox = Ext.getCmp('sv-goto-box_' + view.m_Idx);
                if (gotoBox) {
                    gotoBox.setValue(term);
                }
            }
        };


        btns.push(buttons['ok'] = new Ext.Button({
            text: 'Ok',
            handler: handleButton.createCallback('ok'),
            scope: this,
            hideMode: 'offsets'
        }));
        btns.push(buttons['cancel'] = new Ext.Button({
            text: 'Cancel',
            handler: handleButton.createCallback('cancel'),
            scope: this,
            hideMode: 'offsets'
        }));

        dlg = new Ext.Window({
            autoCreate: true,
            title: titleText,
            resizable: false,
            constrain: true,
            constrainHeader: true,
            minimizable: false,
            maximizable: false,
            stateful: false,
            modal: true,
            shim: true,
            buttonAlign: "center",
            width: 420,
            height: 180,
            minHeight: 80,
            plain: true,
            footer: true,
            closable: true,
            close: function () {
                if (buttons && buttons.no && !buttons.cancel) {
                    handleButton("no");
                } else {
                    handleButton("cancel");
                }
            },
            fbar: new Ext.Toolbar({
                items: btns,
                enableOverflow: false
            })
        });
        dlg.render(document.body);
        dlg.getEl().addClass('x-window-dlg');

        var bodyEl = dlg.body.createChild({
            html: '<div class="ext-mb-content"><span class="ext-mb-text"></span><br/>'
            + '<div class="ext-mb-fix-cursor"><div></div></div></div>'
        });
        //iconEl = Ext.get(bodyEl.dom.firstChild);
        var contentEl = bodyEl.dom.childNodes[0];
        var msgEl = Ext.get(contentEl.firstChild);
        msgEl.update(msgText);

        combo = new Ext.form.ComboBox({
            width: 380,
            typeAhead: true,
            autoSelect: false,
            triggerAction: 'all',
            lazyRender: true,
            mode: 'local',
            store: this.searchPatternStore,
            valueField: 'pattern',
            displayField: 'pattern'
        });

        combo.render(contentEl.childNodes[2].firstChild);

        var comboEl = Ext.get(contentEl.childNodes[2].firstChild);

        comboEl.addKeyListener([10, 13], function () {
            if (combo.isVisible() && buttons) {
                if (buttons.ok) {
                    handleButton("ok");
                } else if (buttons.yes) {
                    handleButton("yes");
                }
            }
        });
        dlg.show();
    },

    //////////////////////////////////////////////////////////////////////////
    // showSearchDlg:

    showSearchDlg: function () {
        var str = Ext.getCmp('sv-goto-box_' + this.m_Idx).getValue();
        openSearchDlg(str);
    },

    openSearchDlg: function (seek, view) {
        var str = seek;
        if (str.length == 0) {
            str = '*';
        }

        if (this.m_SearchDlg) {
            this.m_SearchDlg.close();
            this.m_SearchDlg = null;
        }

        var searchTab = function (title, view, str, tabpanel) {
            var url = view.m_App.m_CGIs.FeatSearch;
            this.m_View = view;
            var params = { term: str, id: this.m_View.m_App.GI, from: this.m_View.m_FromSeq,
                to: (this.m_View.m_FromSeq + this.m_View.m_LenSeq - 1),
                limit: 50, whole: 1
            };
            if (this.m_View.m_App.m_Key && this.m_View.m_App.m_Key.length > 0) {
                params.key = this.m_View.m_App.m_Key;
            }
            switch (title) {
                case "Components":
                    params.type = 'component';
                    break;
                case "Sequence":
                    if (view.m_App.m_ViewParams['acc_type'] == 'protein') {
                        params.type = 'protein';
                    } else {
                        params.type = 'nucleotide';
                    }
                    break;
                case "Features":
                    params.type = 'feature';
                    var tracks = this.m_View.m_App.getActTracks();
                    if (tracks)
                        params.tracks = tracks;
                    break;
            }

            var store = new Ext.data.Store({
                url: url,
                sortInfo: { field: 'label', direction: 'asc' },
                baseParams: params,
                autoLoad: true,
                remoteSort: true,
                job_id: null,
                load: function (options) {
                    var tabEl = Ext.fly(tabpanel.getTabEl(this.panel));
                    tabEl.child('span.x-tab-strip-text').replaceClass('xsv-search-results', this.panel.iconCls);
                    this.storeOptions(options);
                    var data = this.baseParams;
                    Ext.apply(data, { dir: this.sortInfo.direction, sort: this.sortInfo.field });
                    if (options) Ext.apply(data, options.params);
                    //                    var opt = {url: url, data: data, context: this}
                    SeqView.App.simpleAjaxRequest({ url: url, data: data, context: this, success: this.checkJobStatus });
                    return true;
                },
                checkJobStatus: function (data, text, res) {
                    var from_cgi = SeqView.decode(data);
                    if (from_cgi.job_status) {
                        var st = from_cgi.job_status;
                        this.job_id = from_cgi.job_id;
                        if (st == 'submitted' || st == 'running' || st == 'pending') {
                            SeqView.App.simpleAjaxRequest.defer(2000, this, [{ url: url + '?job_key=' + from_cgi.job_id, context: this,
                                success: this.checkJobStatus
                            }]);
                            return;
                        }
                    }
                    this.job_id = null;
                    if (!res.responseText)
                        res.responseText = window.JSON.stringify(data);
                    this.request = {};
                    this.request.arg = { params: this.baseParams };
                    this.request.scope = this;
                    this.request.callback = this.loadRecords;
                    this.proxy.onRead('read', this, res);
                    var tabEl = Ext.fly(tabpanel.getTabEl(this.panel));
                    // tabEl maybe null if the panel was closed 
                    if (tabEl) {
                        var oldCls = this.panel.iconCls;
                        var newCls;
                        if (from_cgi.total > 0)
                            newCls = 'xsv-search-results';
                        tabEl.child('span.x-tab-strip-text').replaceClass(oldCls, newCls);
                        tabEl[newCls ? 'addClass' : 'removeClass']('x-tab-with-icon');
                    }
                },

                reader: new Ext.data.JsonReader(
                    { root: 'features', totalProperty: 'total' },
                    [{ name: 'label' }, { name: 'object_id' }, { name: 'gi' }, { name: 'from' }, { name: 'to' }, { name: 'strand'}]
                )
            });
            var panel = new Ext.grid.GridPanel({
                title: title,
                store: store,
                iconCls: 'xsv-search-loading',
                border: false,
                loadMask: true,
                stripeRows: true,
                first_click: false,
                cm: new Ext.grid.ColumnModel([
                    { header: "Label", width: 110, sortable: true, dataIndex: 'label' },
                    { header: "From", width: 70, sortable: true, dataIndex: 'from', renderer: function (val, params, rec) { return val + 1; } },
                    { header: "To", width: 70, sortable: true, dataIndex: 'to', renderer: function (val, params, rec) { return val + 1; } },
                    { header: "Strand", width: 70, sortable: true, dataIndex: 'strand', renderer: function (val, params, rec) { return val == '-' ? 'Negative' : 'Positive'; } }
                ]),
                viewConfig: { forceFit: true, deferEmptyText: false, emptyText: '<div align="center">No Search Results To Display</div>',
                    templates: {
                        cell: new Ext.Template('<td class="x-grid3-col x-grid3-cell x-grid3-td-{id} x-selectable {css}" style="{style}" tabIndex="0" {cellAttr}>',
                            '<div class="x-grid3-cell-inner x-grid3-col-{id}" {attr}>{value}</div>',
                            '</td>'
                        )
                    }
                },
                autoExpandColumn: 'label',
                listeners: {
                    'rowclick': function (grid, rowIndex, e) {
                        if (grid.first_click) return false;

                        grid.first_click = true;
                        rec = grid.getStore().getAt(rowIndex);
                        var from = rec.get('from');
                        var to = rec.get('to');
                        var view_len = to - from + 1;
                        var view_from = from - view_len * .15;
                        view_len *= 1.3;
                        //len = to - from + seq_5pix * 2;
                        if (store.baseParams.type == 'component') {
                            var tracks_changed = this.m_View.m_App.showTracks({ key: 'component_track' }, true, true);
                            tracks_changed |= this.m_View.m_App.showTracks({ key: 'scaffold_track' }, true, true);

                            if (tracks_changed) this.m_View.m_App.fireEvent('configuration_changed', this.m_View.m_App);
                        }
                        var objid = rec.get('object_id');
                        var sel;
                        if (objid) sel = { sig: objid };
                        else sel = { range: [from, to] };
                        // don't flip here
                        //var flip = rec.get('strand') == '-'; // flip strand for negative features
                        //this.m_View.startImageLoading_ext({from:view_from,len:view_len,flip:flip,sel:sel});
                        this.m_View.startImageLoading_ext({ from: view_from, len: view_len, sel: sel });

                        setTimeout(function () { grid.first_click = false; }, 700);
                    },
                    scope: this
                },
                bbar: new Ext.PagingToolbar({
                    pageSize: 50,
                    store: store,
                    displayInfo: true, displayMsg: 'Displaying Search Results {0} - {1} of {2}', emptyMsg: "No Search Results To Display"
                })

            });
            store.panel = panel;
            panel.on('beforedestroy', function () {
                if (this.store.job_id != null) {
                    SeqView.App.simpleAjaxRequest({ url: this.store.url + '?Cancel=true&job_key=' + this.store.job_id });
                }
            });
            return panel;
        };

        // This is a hack. we need to find a first graphic view in order to get the search range
        // ideally, the search function should be called with the view parameter
        this.forEachView(function (v) { if (!view && v.isGraphic()) view = v; });
        if (view) {
            var tabPanel = new Ext.TabPanel({
                activeTab: 0,
                listeners: {
                    'tabchange': function (tabpanel, tab) {
                        tabpanel.buttons[0].setVisible(tab.title == 'Tracks');
                        if (tab.store.loading && tab.loadMask)
                            tab.loadMask.show();
                    }
                },
                buttons: [{ text: 'Re-configure', hidden: true, scope: this,
                    handler: function () {
                        if (this.m_SearchDlg.getActiveTab().syncModifiedTracks()) {
                            var categories = SeqView.TM.processTracksInfo(this.m_Config.TrackConfig);
                            SeqView.TM.Common.updateSeqViewApp(categories, this);
                        }
                        this.m_SearchDlg.close(); this.m_SearchDlg = null;
                    }
                },
                          { text: 'Close', scope: this, handler: function () { this.m_SearchDlg.close(); this.m_SearchDlg = null; } }
                ]
            });
            tabPanel.add(new searchTab("Features", view, str, tabPanel));
            tabPanel.add(new searchTab("Components", view, str, tabPanel));
            tabPanel.add(new searchTab("Sequence", view, str, tabPanel));
            tabPanel.add(new SeqView.TM.searchTracksTab("Tracks", this.m_Config.TrackConfig, str));
            this.m_SearchDlg = new Ext.Window({
                layout: 'fit',
                title: 'Search Results',
                minWidth: 480, width: 650, height: 350,
                constrain: true, collapsible: true,
                cls: 'SeqViewerApp',
                closeAction: 'close',
                plain: true,
                items: [tabPanel],
                getActiveTab: function ()
                { return tabPanel.activeTab; }
            });
            var app = this;
            this.m_SearchDlg.on('close', function () {
                app.resizeIFrame(); app.m_DialogShown = false;
            });

            app.resizeIFrame(400);
            app.m_DialogShown = true;
            this.m_SearchDlg.show();
        }
    },

    //////////////////////////////////////////////////////////////////////////
    // showFeedbackDlg:

    showFeedbackDlg: function (fbText, fbURL) {
        var app = this;
        var fbCallback = function (the_link_url) {
            app.resizeIFrame(400);
            var feedbackType = ['Suggestion', 'Bug Report', 'Other', 'Initial upload error'];
            var fbType = (fbText) ? 3 : 0;
            if (!fbType) feedbackType.pop();
            var feedbackDlg = new Ext.Window({
                layout: 'fit', modal: true,
                title: 'NCBI Graphical Sequence Viewer feedback',
                width: 600, height: 360,
                minWidth: 400, minHeight: 260,
                constrain: true, resizable: true,
                cls: 'SeqViewerApp',
                closeAction: 'close',
                items: [{
                    xtype: 'form',
                    bodyStyle: 'padding:5px;',
                    labelWidth: 140,
                    frame: true,
                    url: app.m_CGIs.Feedback,
                    labelAlign: 'right',
                    cfg_data: { 'feedback-browser': SeqView.browser + ' ver. ' + SeqView.browser_version,
                        'feedback-os': SeqView.os, 'feedback-url': the_link_url},
                    items: [
                          { xtype: 'combo', triggerAction: 'all', fieldLabel: 'Feedback Type', mode: 'local', name: 'feedback-type',
                              store: feedbackType, allowBlank: false, editable: false, value: feedbackType[fbType], disabled: (fbType > 0)},
                         { xtype: 'textfield', fieldLabel: 'EMail (Optional)', vtype: 'email', allowBlank: true, anchor: '100%', name: 'feedback-email' },
                         { xtype: 'textarea', fieldLabel: '*Feedback', allowBlank: false, anchor: '100% -50', name: 'feedback-text', value: fbText }
                      ]
                }],
                buttons: [
                  { text: 'Send', handler: function () {
                      var form = feedbackDlg.items.items[0].getForm();
                      if (form.isValid()) {
                          for (var i = 0; i < form.items.length; i++) {
                              form.cfg_data[form.items.items[i].getName()] = form.items.items[i].getValue();
                          }
                          SeqView.makeTinyURL(the_link_url, function (res) {
                              form.cfg_data['feedback-url'] = the_link_url + '\n' + (res.id || '');
                              app.AjaxRequest({ url: form.url, data: form.cfg_data, context: feedbackDlg,
                                  success: function (data) {
                                      this.close();
                                      Ext.MessageBox.show({ title: 'Feedback', msg: 'Thank you! We appreciate your feedback.',
                                          buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.INFO
                                      });
                                  },
                                  error: function (data, txt, res) {
                                      console.log('Failed to send feedback: ' + txt);
                                  }
                              });
                          });
                      }
                  }
                  },
                  { text: 'Cancel', handler: function () { feedbackDlg.close(); } }
               ]
            });
            feedbackDlg.on('close', function () { app.resizeIFrame(); app.m_DialogShown = false; });

            app.m_DialogShown = true;
            if (app.m_iFrame) feedbackDlg.show.defer(500, feedbackDlg); else feedbackDlg.show();
        }
        if (fbText) fbCallback(fbURL);
        else this.getLinkToThisPageURL(null, null, fbCallback);
    }

});

//////////////////////////////////////////////////////////////////////////
// SeqView.PrinterFriendlyPage


SeqView.PrinterFriendlyPage = function(app, printdlg) {
    this.values = {orientation: 1, sequence: true, title: true}
    var img_width = this.values['orientation']==2 ? 900 : 650;
    var marker_num = 0;
    this.generator=window.open('','name','width='+(img_width+50)+',height=700,toolbar=0,location=0,status=0,menubar=1,resizable=1,scrollbars=1');
    this.generator.document.write('<html><head><title>'+app.GI+'</title>');
    this.generator.document.write('<link rel="stylesheet" href="'+app.m_CGIs.prefix+'css/style.css">');
    var callFixSeqTrans = false;
    if (this.values['sequence'] && app.m_TextView) {
        if (app.m_TextView.m_HideTrans) {
            callFixSeqTrans = true;
            this.generator.document.write('<script>function fixSeqTrans() {');
            this.generator.document.write('var arr = document.getElementsByTagName("div");');
            this.generator.document.write('for (var i = 0; i < arr.length; i++) {');
            if (app.m_TextView.m_HideTrans == 1) {
                this.generator.document.write('if (arr[i].className.indexOf("seqtrans_trans") == 0) {');
            } else if (app.m_TextView.m_HideTrans == 2) {
                this.generator.document.write('if (arr[i].className.indexOf("seqtrans_prot") == 0) {');
            } else if (app.m_TextView.m_HideTrans == 3) {
                this.generator.document.write('if (arr[i].className.indexOf("seqtrans") == 0) {');
            }
            this.generator.document.write('arr[i].style.display = "none";');
            this.generator.document.write('}}}</script>');
        }
    }
    this.generator.document.write('</head><body onLoad="' + (callFixSeqTrans ? "fixSeqTrans();" : "") + 'window.print()">');
    if (this.values['title'])  {
        this.generator.document.write('<p><b>'+app.m_ViewParams['title']+'</b></p>'); // add title
        this.generator.document.write('<p>'+app.m_ViewParams['id_full']+'</p>'); // add full id
    }

    this.ondataloadcalled = false;
    this.running_requests = 0;
    this.overview_data = null;

    var view_data_idx = 0;
    this.views_data = [];

    this.text_data = null;
    if (this.values['sequence'] && app.m_TextView) { // checkbox checked
        this.col_tmp = app.m_TextView.m_SequenceCols;
        app.m_TextView.m_SequenceCols = this.values['orientation'] == 2 ? (Ext.isWindows ? 100: 110) : (Ext.isWindows ? 70 :80);
        if( app.m_TextView.m_Flip ){
            var numLines = app.m_TextView.m_LenSeq / app.m_TextView.m_SequenceCols;
            numLines = Math.ceil( numLines );
            app.m_TextView.m_LenSeq = numLines * app.m_TextView.m_SequenceCols;
        }
        var the_url = app.m_TextView.getSeqTextURL();
        
        this.running_requests++;
        app.AjaxRequest({url: the_url, context: this,
            success:function(data, text, res) {
                this.text_data = SeqView.decode(data);
                this.running_requests--;
                this.onDataLoaded();
            }
       });
    }

    if ( this.ondataloadcalled === false && this.running_requests == 0) {
        // only sequence title is printed
        this.generator.document.write('</body></html>');
        this.generator.document.close();
    }

    this.onDataLoaded = function() {
        this.ondataloadcalled = true;

        if (this.running_requests != 0)
            return;
        if (this.overview_data) {
            // If the img_url begins with ? it contains only parameters for ncfetch, so prepend ncfetch URL
            // This is a way to provide reliable URL resolution for embedding. SV-1760
            var img_url = this.overview_data.img_url;
            if (img_url && img_url.charAt(0) == '?') {
                img_url = app.m_CGIs.NetCache + img_url;
            }
            this.generator.document.write('<img style="border:1px solid;" src="' + img_url + '">');
        }
        var print_tpl_str = '<div style="position:absolute;top:2px;width:16px;height:16px;left:{left}px;"><div class="marker_label" style="{font_size}border:1px {color} solid;color:black;">{trimmed_label}</div><div class="marker_line" style="border-right:1px solid {color}; height:{height}px;"></div></div>'
        Ext.each(this.views_data, function(view_data) {
            var view = view_data.view;
            var from_cgi = view_data.data;
            this.generator.document.write('<br><br>'+view.m_View.title + '<br>');
            var html = '<div style="position:relative;">';
            var margin = 0;
            if (app.m_MarkersInfo) {
                app.m_MarkersInfo.forEachMarker( function(the_m) {
                    if ( the_m.seq_pos>view.m_VisFromSeq && the_m.seq_pos<(view.m_VisFromSeq+view.m_VisLenSeq-1)) {
                        var bpp = from_cgi.len / img_width;
                        var marker_left = 0;
                        if (view.getFlip())
                            marker_left = (from_cgi.len - (the_m.seq_pos - from_cgi.from) -1 + 0.5) / bpp - 8;
                        else
                            marker_left = (the_m.seq_pos + 0.5 - from_cgi.from) / bpp - 8;

                        var options = {color:the_m.color, left:marker_left, height:from_cgi.h + 4,
                                    num:marker_num, trimmed_label:the_m.marker_name.trimToPix(100),
                                    font_size:'font-size:0.95em;'
                        };
                        marker_num += 1;

                        var print_tpl = new Ext.Template(print_tpl_str);
                        var marker_html = print_tpl.applyTemplate(options);
                        html += marker_html;
                    }
                });
                margin = 21;
            }
            // If the img_url begins with ? it contains only parameters for ncfetch, so prepend ncfetch URL
            // This is a way to provide reliable URL resolution for embedding. SV-1760
            var img_url = from_cgi.img_url;
            if (img_url && img_url.charAt(0) == '?') {
                img_url = app.m_CGIs.NetCache + img_url;
            }
            html += '<img style="border: 1px solid;margin-top:'+margin+'px;" src="' + img_url + '"></div>';
            this.generator.document.write(html);


        },this);

        if (this.text_data) {
            this.generator.document.write('<br><br>Sequence View<br>');
            var top_nums = app.m_TextView.genTopNumbers();
            var html = SeqView.TextView.getViewTmpl().apply({border:1, width:img_width, left_nums:this.text_data.starts, top_nums:top_nums, id: app.m_Idx, sequence:this.text_data.sequence});
            this.generator.document.write(html);
            app.m_TextView.m_SequenceCols = this.col_tmp; // restore back
        }

        this.generator.document.write('</body></html>');
        this.generator.document.close();

    }

};
function globStringToRegexStr(str) {
    return preg_quote(str).replace(/\\\*/g, '.*').replace(/\\\?/g, '.');
}

function globStringToRegex(str) {
    return new RegExp(preg_quote(str).replace(/\\\*/g, '.*').replace(/\\\?/g, '.'), 'i');
}
function preg_quote (str, delimiter) {
    // http://kevin.vanzonneveld.net
    // +   original by: booeyOH
    // +   improved by: Ates Goral (http://magnetiq.com)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Onno Marsman
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // *     example 1: preg_quote("$40");
    // *     returns 1: '\$40'
    // *     example 2: preg_quote("*RRRING* Hello?");
    // *     returns 2: '\*RRRING\* Hello\?'
    // *     example 3: preg_quote("\\.+*?[^]$(){}=!<>|:");
    // *     returns 3: '\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:'
    return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
}
SeqView.TM.searchTracksTab = function(title, tracks_config, str) {
    var trackFilter = function(rec) {
        var query = this.baseParams.query;
        if (query == '') return true;
        var regexp = globStringToRegex(query);
        try {
            if (rec.data.description.search(regexp) >= 0) return true;
            if (rec.data.track.search(regexp) >= 0) return true;
            //if (rec.data.description.search(new RegExp(query, 'i')) >= 0) return true;
            //if (rec.data.track.search(new RegExp(query, 'i')) >= 0) return true;
        } catch(err) {
            console.log(err.message);
        }        
        return false;
    };
    var pageSize = 10; 
    var store = new Ext.data.Store({
        autoLoad: false,
        remoteSort: false,

        baseParams: { query: str || '', limit: pageSize},
        reader: new Ext.data.ArrayReader({
            fields: [
                {name:'order', convert: function(v, rec){ return rec.order }},
                {name:'uuid', convert: function(v, rec){ return rec.uuid }},
                {name:'category', convert: function(v, rec){ return rec.category.display_name }},
                {name:'track', convert: function(v, rec){ return rec.display_name }},
                {name:'description', convert: function(v, rec){ return rec.help }},
                {name:'shown', convert: function(v, rec){ return rec.shown }}]
        }),
        data: tracks_config,
        sortInfo: {field:'order', direction:'asc'},
        reload: function() {
            store.filter([{fn: trackFilter}]);
        }
    });
    var panel = new SeqView.TM.GridBase({//Ext.grid.GridPanel({
        title: (title) ? title : null,
        store: store,
        iconCls: 'xsv-search-loading',
        border: false,
        stripeRows: true,
        tracks: tracks_config,
        colModel: new Ext.grid.ColumnModel([
           {header: "Category", width: 40, sortable: true, dataIndex: 'category', editable: false},
           {xtype: 'checkcolumn', header: 'Active', sortable: true, dataIndex: 'shown', width: 20},
           {header: "Track", width: 70, sortable: true, dataIndex: 'track', editable: false},
           {header: "Description", dataIndex: 'description', editable: false}
        ]),
        selModel:  new Ext.grid.RowSelectionModel(),
        viewConfig: {forceFit:true, deferEmptyText:false, emptyText:'<div align="center">No Search Results To Display</div>'},
        autoExpandColumn: 'description'
    });
    store.panel = panel;
    
    store.filter([{fn: trackFilter, scope: store}]);
    if (title) store.panel.iconCls = (store.getCount()) ? 'xsv-search-results' : '';
    return panel;
};
}
