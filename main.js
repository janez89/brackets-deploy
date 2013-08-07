/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

/** Simple extension that adds a "File > Hello World" menu item. Inserts "Hello, world!" at cursor pos. */
define(function (require, exports, module) {
    "use strict";

    var AppInit             = brackets.getModule("utils/AppInit"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        Menus               = brackets.getModule("command/Menus"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        PreferencesManager  = brackets.getModule( "preferences/PreferencesManager" ),
        Dialogs             = brackets.getModule("widgets/Dialogs"),
        FileUtils           = brackets.getModule("file/FileUtils");

    var preferences         = PreferencesManager.getPreferenceStorage( module, { enabled: false } ),
        projectMenu         = Menus.getContextMenu(Menus.ContextMenuIds.PROJECT_MENU),
        workingsetMenu      = Menus.getContextMenu(Menus.ContextMenuIds.WORKING_SET_MENU),
        Menu                = Menus.addMenu("Deploy", "deploy");

    var config = null,
        projectDir = "";

    // Project init
    function projectInit (error) {
        // remove
        projectMenu.removeMenuItem(DEPLOY_UPLOAD);
        workingsetMenu.removeMenuItem(DEPLOY_UPLOAD);
        if (error)
            return;
        // add
        projectMenu.addMenuItem(DEPLOY_UPLOAD, "", Menus.LAST);
        workingsetMenu.addMenuItem(DEPLOY_UPLOAD, "", Menus.LAST);
    }

    function projectChange () {
        if (ProjectManager.getProjectRoot().fullPath === projectDir)
            return;
        // new directory
        projectDir = ProjectManager.getProjectRoot().fullPath;
        // read config
        FileUtils.readAsText(projectDir+'deploy.json').done(function (text, timestamp) {
            try {
                config = JSON.parse(text);
                return projectInit(false);
            } catch (error) {
                config = null;
                projectInit(true);
            }
        }).fail(function (error){
            // invalid json file or not found

            projectInit(true);
        });
    }

    // observe saves
    $(DocumentManager).on('documentSaved', function (e, doc) {
        if (!config)
            return;
    });

    AppInit.appReady(function () {
        projectChange();
    });


    // Manage local sotrage
    var Store = {
        prefix: '',
        get: function (key) {
            return localStorage.getItem(this.prefix + key);
        },
        set: function (key, value) {
            return localStorage.setItem(this.prefix + key, value);
        },
        rm: function (key) {
            return localStorage.removeItem(this.prefix + key);
        }
    };
    // Element IDs
    var DEPLOY_SETTINGS = 'deploy.settings',
        DEPLOY_UPLOAD = 'deploy.upload',
        DEPLOY_ABOUT = 'deploy.about',
        // dialogs
        DEPLOY_SETTINGS_DLG = 'deploy.dlg.settings',
        DEPLOY_ABOUT_DLG = 'deploy.dlg.about';

    // --- dialog ---------------------
    var htmlContents = {};
    htmlContents[DEPLOY_SETTINGS_DLG] = require("text!html/settings.html");
    htmlContents[DEPLOY_ABOUT_DLG] = require("text!html/about.html");

    function Modal (ID, title) {
        return Dialogs.showModalDialog(
            ID, // ID the specify the dialog
            title, // Title
            htmlContents[ID],// HTML-Content
            [                        // Buttons
                {className: Dialogs.DIALOG_BTN_CLASS_PRIMARY, id: Dialogs.DIALOG_BTN_OK, text: "Save"},
                {className: Dialogs.DIALOG_BTN_CLASS_NORMAL, id: Dialogs.DIALOG_BTN_CANCEL, text: "Cancel"}
            ]
        );
    }


    // --- commands --------------------
    // about dialog
    CommandManager.register("About", DEPLOY_ABOUT, function () {
        Modal(DEPLOY_ABOUT_DLG, "About").done(function (resp) {

        });
    });
    // Settings
    CommandManager.register("Settings", DEPLOY_SETTINGS, function () {
        Modal(DEPLOY_SETTINGS_DLG, "Deploy Settings").done(function (resp) {
            if(resp !== "ok")
                return;
            var deployStr = JSON.stringify({
                "protocol": $("#deploy-protocol").val(),
                "server": $('#deploy-server').val(),
                "port": parseInt($('#deploy-port').val(), 10),
                "user": $('#deploy-user').val(),
                "password": $('#deploy-password').val(),
                "remotePath": $('#deploy-path').val(),
                "ExpilcitSave": true, // CTRL-S
                "ignore": []
            });
            // write to file

        });
    });
    // upload files
    CommandManager.register("Upload file", DEPLOY_UPLOAD, function () {

    });

    // --- menu elements ---------------
    // main menu
    Menu.addMenuItem(DEPLOY_SETTINGS);
    Menu.addMenuDivider();
    Menu.addMenuItem(DEPLOY_ABOUT);
});