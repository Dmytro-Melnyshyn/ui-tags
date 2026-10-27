import { act } from 'react';
import { useStripes } from '@folio/stripes/core';
import { render } from '@folio/jest-config-stripes/testing-library/react';
import userEvent from '@folio/jest-config-stripes/testing-library/user-event';

import { reducer as formReducer } from 'redux-form';
import {
  createStore,
  combineReducers,
} from 'redux';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import TagSettings from './TagSettings';
import buildStripes from '../../test/jest/__mock__/stripesCore.mock';

const store = createStore(combineReducers({ form: formReducer }));
const history = createMemoryHistory();

const mockSettingsPost = jest.fn().mockResolvedValue({});
const mockSettingsPut = jest.fn().mockResolvedValue({});

const mockStripes = buildStripes({
  connect: (Component) => (props) => {
    const mockResources = {
      settings: {
        hasLoaded: true,
        records: [],
      },
    };

    const mockMutator = {
      settings: {
        POST: mockSettingsPost,
        PUT: mockSettingsPut,
      },
    };

    return <Component {...props} resources={mockResources} mutator={mockMutator} stripes={mockStripes} />;
  },
  user: {
    perms: {
      'ui-tags.settings.all': true,
    },
  },
});

const renderTagSettings = (props = {}) => render(
  <Provider store={store}>
    <Router history={history}>
      <TagSettings
        label="Tags label"
        {...props}
      />
    </Router>
  </Provider>
);

describe('Tag Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useStripes.mockReturnValue(mockStripes);
  });

  it('should render ConfigManager component ', () => {
    const { getByText } = renderTagSettings();

    expect(getByText('Tags label')).toBeInTheDocument();
  });

  describe('when changing the flag and saving', () => {
    it('should save to the settings API', async () => {
      const { getByText, getByRole } = renderTagSettings();

      expect(getByRole('checkbox', { name: 'ui-tags.settings.enableTags' })).toBeChecked();

      await act(async () => userEvent.click(getByRole('checkbox', { name: 'ui-tags.settings.enableTags' })));
      expect(getByRole('checkbox', { name: 'ui-tags.settings.enableTags' })).not.toBeChecked();

      expect(getByText('stripes-core.button.save')).toBeEnabled();
      await act(async () => userEvent.click(getByText('stripes-core.button.save')));

      expect(mockSettingsPost).toHaveBeenCalledWith({
        id: expect.any(String),
        key: 'tags_enabled',
        scope: 'ui-tags.tags.manage',
        value: false,
      });
    });

    it('should use PUT when updating existing setting', async () => {
      const existingSettingId = 'existing-setting-id';

      const mockStripesWithExistingSetting = buildStripes({
        connect: (Component) => (props) => {
          const mockResources = {
            settings: {
              hasLoaded: true,
              records: [{
                items: [{
                  id: existingSettingId,
                  value: true,
                  scope: 'ui-tags.tags.manage',
                  key: 'tags_enabled',
                }],
              }],
            },
          };

          const mockMutator = {
            settings: {
              POST: mockSettingsPost,
              PUT: mockSettingsPut,
            },
          };

          return <Component {...props} resources={mockResources} mutator={mockMutator} stripes={mockStripesWithExistingSetting} />;
        },
        user: {
          perms: {
            'ui-tags.settings.all': true,
          },
        },
      });

      useStripes.mockReturnValue(mockStripesWithExistingSetting);

      const { getByText, getByRole } = renderTagSettings();

      expect(getByRole('checkbox', { name: 'ui-tags.settings.enableTags' })).toBeChecked();

      await act(async () => userEvent.click(getByRole('checkbox', { name: 'ui-tags.settings.enableTags' })));
      expect(getByRole('checkbox', { name: 'ui-tags.settings.enableTags' })).not.toBeChecked();

      expect(getByText('stripes-core.button.save')).toBeEnabled();
      await act(async () => userEvent.click(getByText('stripes-core.button.save')));

      expect(mockSettingsPut).toHaveBeenCalledWith({
        id: existingSettingId,
        key: 'tags_enabled',
        scope: 'ui-tags.tags.manage',
        value: false,
      });
    });
  });
});
