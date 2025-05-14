import { Settings as SettingsType } from '@/hooks/useSettings';

interface SettingsProps {
  onClose: () => void;
  settings: SettingsType;
  onSettingsChange: (settings: Partial<SettingsType>) => void;
}

export default function Settings({ onClose, settings, onSettingsChange }: SettingsProps) {
  const handleChange = (key: keyof SettingsType, value: SettingsType[keyof SettingsType]) => {
    onSettingsChange({ [key]: value });
  };

  return (
    <div className="fixed right-0 top-0 h-full w-64 bg-gray-800 text-white p-4 shadow-lg transform transition-transform z-50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Settings</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded">
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={(e) => handleChange('darkMode', e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span>Dark Mode</span>
          </label>
        </div>

        <div>
          <label className="block mb-2">Font Size</label>
          <select
            value={settings.fontSize}
            onChange={(e) =>
              handleChange(
                'fontSize',
                e.target.value === 'auto' ? 'auto' : parseInt(e.target.value)
              )
            }
            className="w-full bg-gray-700 rounded p-2"
          >
            <option value="auto">Auto</option>
            {[12, 14, 16, 18, 20, 24].map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.showTooltips}
              onChange={(e) => handleChange('showTooltips', e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span>Show Tooltips</span>
          </label>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.ankiEnabled}
              onChange={(e) => handleChange('ankiEnabled', e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span>Enable Anki Integration</span>
          </label>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.invertColors}
              onChange={(e) => handleChange('invertColors', e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span>Invert Colors</span>
          </label>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.singlePageView}
              onChange={(e) => handleChange('singlePageView', e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span>Single Page View</span>
          </label>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.rightToLeft}
              onChange={(e) => handleChange('rightToLeft', e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span>Right to Left</span>
          </label>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.hasCover}
              onChange={(e) => handleChange('hasCover', e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span>Has Cover Page</span>
          </label>
        </div>
      </div>
    </div>
  );
}
