/**
 * @license   http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author    Volker Theile <volker.theile@openmediavault.org>
 * @author    OpenMediaVault Plugin Developers <plugins@omv-extras.org>
 * @copyright Copyright (c) 2009-2013 Volker Theile
 * @copyright Copyright (c) 2013-2015 OpenMediaVault Plugin Developers
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
// require("js/omv/WorkspaceManager.js")
// require("js/omv/workspace/grid/Panel.js")
// require("js/omv/workspace/window/Form.js")
// require("js/omv/workspace/window/plugin/ConfigObject.js")
// require("js/omv/Rpc.js")
// require("js/omv/data/Store.js")
// require("js/omv/data/Model.js")
// require("js/omv/data/proxy/Rpc.js")
// require("js/omv/form/field/SharedFolderComboBox.js")

Ext.define("OMV.module.admin.service.snapraid.Drive", {
    extend : "OMV.workspace.window.Form",
    uses   : [
        "OMV.form.field.SharedFolderComboBox",
        "OMV.workspace.window.plugin.ConfigObject"
    ],

    rpcService   : "SnapRaid",
    rpcGetMethod : "getDrive",
    rpcSetMethod : "setDrive",
    plugins      : [{
        ptype : "configobject"
    }],

    width : 575,

    getFormItems: function () {
        return [{
            xtype         : "combo",
            name          : "mntentref",
            fieldLabel    : _("Drive"),
            emptyText     : _("Select a drive ..."),
            allowBlank    : false,
            allowNone     : false,
            editable      : false,
            triggerAction : "all",
            displayField  : "description",
            valueField    : "uuid",
            store         : Ext.create("OMV.data.Store", {
                autoLoad : true,
                model    : OMV.data.Model.createImplicit({
                    idProperty : "uuid",
                    fields     : [
                        { name : "uuid", type : "string" },
                        { name : "devicefile", type : "string" },
                        { name : "description", type : "string" }
                    ]
                }),
                proxy : {
                    type : "rpc",
                    rpcData : {
                        service : "ShareMgmt",
                        method  : "getCandidates"
                    },
                    appendSortParams : false
                },
                sorters : [{
                    direction : "ASC",
                    property  : "devicefile"
                }]
            })
        },{
            xtype      : "textfield",
            name       : "name",
            fieldLabel : _("Name"),
            allowBlank : false
        },{
            xtype      : "checkbox",
            name       : "content",
            fieldLabel : _("Content"),
            boxLabel   : _("Drive where content file is stored.  This file is a list of saved files and contains the details of your backup with all the checksums to verify its integrity."),
            checked    : false
        },{
            xtype      : "checkbox",
            name       : "data",
            fieldLabel : _("Data"),
            boxLabel   : _("Drive where data is stored."),
            checked    : false
        },{
            xtype      : "checkbox",
            name       : "parity",
            fieldLabel : _("Parity"),
            boxLabel   : _("Drive where parity files are stored which are necessary to recover from disk failure.  For each parity drive, one data drive can fail without data loss."),
            checked    : false
        }];
    }
});

Ext.define("OMV.module.admin.service.snapraid.DriveList", {
    extend   : "OMV.workspace.grid.Panel",
    requires : [
        "OMV.Rpc",
        "OMV.data.Store",
        "OMV.data.Model",
        "OMV.data.proxy.Rpc"
    ],
    uses     : [
        "OMV.module.admin.service.snapraid.Content"
    ],

    hidePagingToolbar : false,
    stateful          : true,
    stateId           : "9879057b-b2c0-4c48-a4c1-8c9b4fb54d7b",
    columns           : [{
        text      : _("Name"),
        sortable  : true,
        dataIndex : "name",
        stateId   : "name"
    },{
        text      : _("Label"),
        sortable  : true,
        dataIndex : "label",
        stateId   : "label"
    },{
        xtype     : "booleaniconcolumn",
        header    : _("Content"),
        sortable  : true,
        dataIndex : "content",
        align     : "center",
        width     : 80,
        resizable : false,
        trueIcon  : "switch_on.png",
        falseIcon : "switch_off.png"
    },{
        xtype     : "booleaniconcolumn",
        header    : _("Data"),
        sortable  : true,
        dataIndex : "data",
        align     : "center",
        width     : 80,
        resizable : false,
        trueIcon  : "switch_on.png",
        falseIcon : "switch_off.png"
    },{
        xtype     : "booleaniconcolumn",
        header    : _("Parity"),
        sortable  : true,
        dataIndex : "parity",
        align     : "center",
        width     : 80,
        resizable : false,
        trueIcon  : "switch_on.png",
        falseIcon : "switch_off.png"
    }],

    getTopToolbarItems: function() {
        var me = this;
        var items = me.callParent(arguments);

        Ext.Array.insert(items, 3, [{
            id       : me.getId() + "-sync",
            xtype    : "button",
            text     : _("Sync"),
            icon     : "images/refresh.png",
            iconCls  : Ext.baseCSSPrefix + "btn-icon-16x16",
            handler  : Ext.Function.bind(me.onCommandButton, me, [ "sync" ]),
            scope    : me
        },{
            id       : me.getId() + "-scrub",
            xtype    : "button",
            text     : _("Scrub"),
            icon     : "images/erase.png",
            iconCls  : Ext.baseCSSPrefix + "btn-icon-16x16",
            handler  : Ext.Function.bind(me.onCommandButton, me, [ "scrub" ]),
            scope    : me
        },{
            id       : me.getId() + "-check",
            xtype    : "button",
            text     : _("Check"),
            icon     : "images/checkmark.png",
            iconCls  : Ext.baseCSSPrefix + "btn-icon-16x16",
            handler  : Ext.Function.bind(me.onCommandButton, me, [ "check" ]),
            scope    : me
        },{
            id       : me.getId() + "-diff",
            xtype    : "button",
            text     : _("Diff"),
            icon     : "images/details.png",
            iconCls  : Ext.baseCSSPrefix + "btn-icon-16x16",
            handler  : Ext.Function.bind(me.onCommandButton, me, [ "diff" ]),
            scope    : me
        },{
            id       : me.getId() + "-status",
            xtype    : "button",
            text     : _("Status"),
            icon     : "images/pulse.png",
            iconCls  : Ext.baseCSSPrefix + "btn-icon-16x16",
            handler  : Ext.Function.bind(me.onCommandButton, me, [ "status" ]),
            scope    : me
        },{
            id       : me.getId() + "-fix",
            xtype    : "button",
            text     : _("Fix"),
            icon     : "images/aid.png",
            iconCls  : Ext.baseCSSPrefix + "btn-icon-16x16",
            handler  : Ext.Function.bind(me.onCommandButton, me, [ "fix" ]),
            scope    : me
        },{
            id       : me.getId() + "-pool",
            xtype    : "button",
            text     : _("Pool"),
            icon     : "images/grid.png",
            iconCls  : Ext.baseCSSPrefix + "btn-icon-16x16",
            handler  : Ext.Function.bind(me.onCommandButton, me, [ "pool" ]),
            scope    : me
        }]);
        return items;
    },

    initComponent : function () {
        var me = this;
        Ext.apply(me, {
            store : Ext.create("OMV.data.Store", {
                autoLoad : true,
                model    : OMV.data.Model.createImplicit({
                    idProperty  : "uuid",
                    fields      : [
                        { name : "uuid", type : "string" },
                        { name : "name", type : "string" },
                        { name : "label", type : "string" },
                        { name : "content", type : "boolean" },
                        { name : "data", type : "boolean" },
                        { name : "parity", type : "boolean" }
                    ]
                }),
                proxy : {
                    type    : "rpc",
                    rpcData : {
                        service : "SnapRaid",
                        method  : "getDriveList"
                    }
                }
            })
        });
        me.callParent(arguments);
    },

    onAddButton : function () {
        var me = this;
        Ext.create("OMV.module.admin.service.snapraid.Drive", {
            title     : _("Add drive"),
            uuid      : OMV.UUID_UNDEFINED,
            listeners : {
                scope  : me,
                submit : function () {
                    this.doReload();
                }
            }
        }).show();
    },

    onEditButton : function() {
        var me = this;
        var record = me.getSelected();
        Ext.create("OMV.module.admin.service.snapraid.Drive", {
            title     : _("Edit drive"),
            uuid      : record.get("uuid"),
            listeners : {
                scope  : me,
                submit : function() {
                    this.doReload();
                }
            }
        }).show();
    },

    doDeletion : function (record) {
        var me = this;
        OMV.Rpc.request({
            scope    : me,
            callback : me.onDeletion,
            rpcData  : {
                service : "SnapRaid",
                method  : "deleteDrive",
                params  : {
                    uuid : record.get("uuid")
                }
            }
        });
    },

    onCommandButton : function(cmd) {
        var me = this;
        Ext.create("OMV.window.Execute", {
            title      : "SnapRAID " + cmd,
            rpcService : "SnapRaid",
            rpcMethod  : "executeCommand",
            rpcParams  : {
                command : cmd
            },
            hideStopButton  : true,
            listeners       : {
                scope     : me,
                exception : function(wnd, error) {
                    OMV.MessageBox.error(null, error);
                }
            }
        }).show();
    }
});

OMV.WorkspaceManager.registerPanel({
    id        : "contents",
    path      : "/service/snapraid",
    text      : _("Drives"),
    position  : 20,
    className : "OMV.module.admin.service.snapraid.DriveList"
});
