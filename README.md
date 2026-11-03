# Focus Timer

A calm, native-looking Pomodoro timer for GNOME Shell 45–50.

## Features

- Start, pause, resume, reset, and skip from the panel
- Focus, short-break, and long-break cycles
- Configurable durations and long-break interval
- Optional automatic starts, notifications, and completion sound
- Optional Do Not Disturb during focus sessions
- Native GNOME/Libadwaita preferences
- English plus Arabic, German, Spanish, French, Italian, Japanese, Korean,
  Portuguese, Russian, and Chinese translations
- Donate link for supporting development

## Install from source

```bash
chmod +x install.sh
./install.sh
```

Log out and back in (required on Wayland), then enable `pomodoro@lsbcodes`
using Extensions, Extension Manager, or:

```bash
gnome-extensions enable pomodoro@lsbcodes
```

Open **Timer Settings** from the panel menu to adjust the timer.

Enable **Do Not Disturb during focus** under **Automation** to silence notifications
while a focus timer is running. Pausing, resetting, skipping, finishing a session,
or disabling the extension restores notifications if the timer silenced them.
Do Not Disturb that was already enabled and manual changes are respected.

## Package

```bash
chmod +x pack-extension.sh
./pack-extension.sh
```

## Author

[lsantiagoba](https://github.com/lsantiagoba) · [Donate with PayPal](https://paypal.me/leandrosb3)

## License

GPL-3.0-or-later
