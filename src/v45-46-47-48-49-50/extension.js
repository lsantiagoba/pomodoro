import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Extension, gettext as _, ngettext} from 'resource:///org/gnome/shell/extensions/extension.js';

const Mode = Object.freeze({FOCUS: 'focus', SHORT_BREAK: 'short-break', LONG_BREAK: 'long-break'});

const FocusTimerIndicator = GObject.registerClass(
class FocusTimerIndicator extends PanelMenu.Button {
    constructor(extension) {
        super(0.0, _('Focus Timer'));
        this._extension = extension;
        this._settings = extension.getSettings();
        this._mode = Mode.FOCUS;
        this._running = false;
        this._sessions = 0;
        this._timeoutId = 0;
        this._remaining = this._durationForMode();

        this._buildPanel();
        this._buildMenu();
        this._settingsChangedId = this._settings.connect('changed', () => {
            if (!this._running)
                this._remaining = this._durationForMode();
            this._sync();
        });
        this._sync();
    }

    _buildPanel() {
        const box = new St.BoxLayout({style_class: 'panel-status-menu-box'});
        this._panelIcon = new St.Icon({icon_name: 'alarm-symbolic', style_class: 'system-status-icon'});
        this._panelLabel = new St.Label({text: _('Focus'), y_align: Clutter.ActorAlign.CENTER});
        box.add_child(this._panelIcon);
        box.add_child(this._panelLabel);
        this.add_child(box);
    }

    _buildMenu() {
        const cardItem = new PopupMenu.PopupBaseMenuItem({reactive: false, can_focus: false});
        cardItem.add_style_class_name('focus-card-item');
        const card = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, x_expand: true, style_class: 'focus-card'});

        this._modeLabel = new St.Label({style_class: 'focus-mode-label', x_align: Clutter.ActorAlign.CENTER});
        this._timerLabel = new St.Label({style_class: 'focus-time-label', x_align: Clutter.ActorAlign.CENTER});
        this._sessionLabel = new St.Label({style_class: 'focus-session-label', x_align: Clutter.ActorAlign.CENTER});
        card.add_child(this._modeLabel);
        card.add_child(this._timerLabel);
        card.add_child(this._sessionLabel);

        const controls = new St.BoxLayout({style_class: 'focus-controls', x_align: Clutter.ActorAlign.CENTER});
        this._resetButton = this._iconButton('view-refresh-symbolic', _('Reset'));
        this._startButton = new St.Button({style_class: 'focus-primary-button', can_focus: true});
        this._startContent = new St.BoxLayout({style_class: 'focus-primary-content'});
        this._startIcon = new St.Icon({icon_name: 'media-playback-start-symbolic'});
        this._startText = new St.Label({text: _('Start'), y_align: Clutter.ActorAlign.CENTER});
        this._startContent.add_child(this._startIcon);
        this._startContent.add_child(this._startText);
        this._startButton.set_child(this._startContent);
        this._skipButton = this._iconButton('media-skip-forward-symbolic', _('Skip'));
        controls.add_child(this._resetButton);
        controls.add_child(this._startButton);
        controls.add_child(this._skipButton);
        card.add_child(controls);
        cardItem.add_child(card);
        this.menu.addMenuItem(cardItem);

        this._startButton.connect('clicked', () => this._toggle());
        this._resetButton.connect('clicked', () => this._reset());
        this._skipButton.connect('clicked', () => this._complete(false));

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        const preferences = new PopupMenu.PopupMenuItem(_('Timer Settings'));
        preferences.add_child(new St.Icon({icon_name: 'emblem-system-symbolic', style_class: 'popup-menu-icon'}));
        preferences.connect('activate', () => this._extension.openPreferences());
        this.menu.addMenuItem(preferences);
    }

    _iconButton(iconName, accessibleName) {
        return new St.Button({
            child: new St.Icon({icon_name: iconName}),
            style_class: 'focus-icon-button',
            can_focus: true,
            accessible_name: accessibleName,
        });
    }

    _durationForMode() {
        const key = this._mode === Mode.FOCUS ? 'focus-duration' :
            this._mode === Mode.SHORT_BREAK ? 'short-break-duration' : 'long-break-duration';
        return this._settings.get_int(key) * 60;
    }

    _toggle() {
        this._running = !this._running;
        if (this._running) {
            this._deadline = GLib.get_monotonic_time() + this._remaining * GLib.USEC_PER_SEC;
            this._stopTimeout();
            this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => this._tick());
        } else {
            this._stopTimeout();
        }
        this._sync();
    }

    _tick() {
        this._remaining = Math.max(0, Math.ceil((this._deadline - GLib.get_monotonic_time()) / GLib.USEC_PER_SEC));
        if (this._remaining <= 0) {
            this._timeoutId = 0;
            this._complete(true);
            return GLib.SOURCE_REMOVE;
        }
        this._sync();
        return GLib.SOURCE_CONTINUE;
    }

    _reset() {
        this._running = false;
        this._stopTimeout();
        this._remaining = this._durationForMode();
        this._sync();
    }

    _complete(notify) {
        const completedMode = this._mode;
        this._running = false;
        this._stopTimeout();
        if (completedMode === Mode.FOCUS) {
            this._sessions++;
            const interval = this._settings.get_int('sessions-before-long-break');
            this._mode = this._sessions % interval === 0 ? Mode.LONG_BREAK : Mode.SHORT_BREAK;
        } else {
            this._mode = Mode.FOCUS;
        }
        this._remaining = this._durationForMode();

        if (notify && this._settings.get_boolean('show-notifications')) {
            const title = completedMode === Mode.FOCUS ? _('Focus session complete') : _('Break complete');
            const body = completedMode === Mode.FOCUS ? _('Nice work. Time to recharge.') : _('Ready for another focused session?');
            Main.notify(title, body);
        }
        if (notify && this._settings.get_boolean('play-sound'))
            global.display.get_sound_player().play_from_theme('complete', _('Timer complete'), null);

        const autoStart = this._mode === Mode.FOCUS ?
            this._settings.get_boolean('auto-start-focus') : this._settings.get_boolean('auto-start-breaks');
        if (autoStart)
            this._toggle();
        else
            this._sync();
    }

    _sync() {
        const minutes = Math.floor(this._remaining / 60);
        const seconds = this._remaining % 60;
        const time = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        const modeText = this._mode === Mode.FOCUS ? _('Focus session') :
            this._mode === Mode.SHORT_BREAK ? _('Short break') : _('Long break');
        this._modeLabel.text = modeText.toUpperCase();
        this._timerLabel.text = time;
        this._sessionLabel.text = ngettext(
            '%d session completed',
            '%d sessions completed',
            this._sessions
        ).replace('%d', this._sessions.toString());
        this._panelLabel.text = this._running ? time : _('Focus');
        this._panelIcon.icon_name = this._mode === Mode.FOCUS ? 'alarm-symbolic' : 'weather-clear-night-symbolic';
        this._startIcon.icon_name = this._running ? 'media-playback-pause-symbolic' : 'media-playback-start-symbolic';
        this._startText.text = this._running ? _('Pause') : this._remaining === this._durationForMode() ? _('Start') : _('Resume');
    }

    _stopTimeout() {
        if (this._timeoutId) {
            GLib.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }
    }

    destroy() {
        this._stopTimeout();
        if (this._settingsChangedId)
            this._settings.disconnect(this._settingsChangedId);
        this._settings = null;
        super.destroy();
    }
});

export default class PomodoroExtension extends Extension {
    enable() {
        this._indicator = new FocusTimerIndicator(this);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
    }
}
