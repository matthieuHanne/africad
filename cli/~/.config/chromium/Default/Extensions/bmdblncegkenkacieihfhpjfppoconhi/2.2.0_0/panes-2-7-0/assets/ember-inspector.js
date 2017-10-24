"use strict";



define('ember-inspector/adapters/basic', ['exports', 'ember', 'ember-inspector/config/environment'], function (exports, _ember, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

  var computed = _ember.default.computed;
  exports.default = _ember.default.Object.extend({
    /**
     * Called when the adapter is created (when
     * the inspector app boots).
     *
     * @method init
     */
    init: function init() {
      this._super.apply(this, arguments);
      this._checkVersion();
    },


    /**
     * Listens to `EmberInspectorDebugger` message about
     * Ember version mismatch. If a mismatch message is received
     * it means the current inspector app does not support the current
     * Ember version and needs to switch to an inspector version
     * that does.
     *
     * @method _checkVersion
     * @private
     */
    _checkVersion: function _checkVersion() {
      var _this = this;

      this.onMessageReceived(function (message) {
        var name = message.name,
            version = message.version;

        if (name === 'version-mismatch') {
          var previousVersions = _environment.default.previousEmberVersionsSupported;

          var _config$emberVersions = _slicedToArray(_environment.default.emberVersionsSupported, 2),
              fromVersion = _config$emberVersions[0],
              tillVersion = _config$emberVersions[1];

          var neededVersion = void 0;

          if (compareVersion(version, fromVersion) === -1) {
            neededVersion = previousVersions[previousVersions.length - 1];
          } else if (tillVersion && compareVersion(version, tillVersion) !== -1) {
            neededVersion = tillVersion;
          } else {
            return;
          }
          _this.onVersionMismatch(neededVersion);
        }
      });
      this.sendMessage({ type: 'check-version', from: 'devtools' });
    },


    /**
     * Hook called when the Ember version is not
     * supported by the current inspector version.
     *
     * Each adapter should implement this hook
     * to switch to an older/new inspector version
     * that supports this Ember version.
     *
     * @method onVersionMismatch
     * @param {String} neededVersion (The version to go to)
     */
    onVersionMismatch: function onVersionMismatch() {},


    name: 'basic',

    /**
      Used to send messages to EmberDebug
       @param type {Object} the message to the send
    **/
    sendMessage: function sendMessage() {},


    /**
      Register functions to be called
      when a message from EmberDebug is received
    **/
    onMessageReceived: function onMessageReceived(callback) {
      this.get('_messageCallbacks').pushObject(callback);
    },


    _messageCallbacks: computed(function () {
      return [];
    }),

    _messageReceived: function _messageReceived(message) {
      this.get('_messageCallbacks').forEach(function (callback) {
        callback(message);
      });
    },


    // Called when the "Reload" is clicked by the user
    willReload: function willReload() {},


    canOpenResource: false,
    openResource: function openResource() /* file, line */{}
  });


  /**
   * Compares two Ember versions.
   *
   * Returns:
   * `-1` if version < version
   * 0 if version1 == version2
   * 1 if version1 > version2
   *
   * @param {String} version1
   * @param {String} version2
   * @return {Boolean} result of the comparison
   */
  function compareVersion(version1, version2) {
    version1 = cleanupVersion(version1).split('.');
    version2 = cleanupVersion(version2).split('.');
    for (var i = 0; i < 3; i++) {
      var compared = compare(+version1[i], +version2[i]);
      if (compared !== 0) {
        return compared;
      }
    }
    return 0;
  }

  /* Remove -alpha, -beta, etc from versions */
  function cleanupVersion(version) {
    return version.replace(/-.*/g, '');
  }

  function compare(val, number) {
    if (val === number) {
      return 0;
    } else if (val < number) {
      return -1;
    } else if (val > number) {
      return 1;
    }
  }
});
define('ember-inspector/adapters/bookmarklet', ['exports', 'ember-inspector/adapters/basic', 'ember'], function (exports, _basic, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var computed = _ember.default.computed;
  exports.default = _basic.default.extend({
    name: 'bookmarklet',

    /**
     * Called when the adapter is created.
     *
     * @method init
     */
    init: function init() {
      this._connect();
      return this._super.apply(this, arguments);
    },


    inspectedWindow: computed(function () {
      return window.opener || window.parent;
    }),

    inspectedWindowURL: computed(function () {
      return loadPageVar('inspectedWindowURL');
    }),

    sendMessage: function sendMessage(options) {
      options = options || {};
      this.get('inspectedWindow').postMessage(options, this.get('inspectedWindowURL'));
    },


    /**
     * Redirect to the correct inspector version.
     *
     * @method onVersionMismatch
     * @param {String} goToVersion
     */
    onVersionMismatch: function onVersionMismatch(goToVersion) {
      this.sendMessage({ name: 'version-mismatch', version: goToVersion });
      window.location.href = '../panes-' + goToVersion.replace(/\./g, '-') + '/index.html' + window.location.search;
    },
    _connect: function _connect() {
      var _this = this;

      window.addEventListener('message', function (e) {
        var message = e.data;
        if (e.origin !== _this.get('inspectedWindowURL')) {
          return;
        }
        // close inspector if inspected window is unloading
        if (message && message.unloading) {
          window.close();
        }
        if (message.from === 'inspectedWindow') {
          _this._messageReceived(message);
        }
      });
    }
  });


  function loadPageVar(sVar) {
    return decodeURI(window.location.search.replace(new RegExp('^(?:.*[&\\?]' + encodeURI(sVar).replace(/[\.\+\*]/g, "\\$&") + '(?:\\=([^&]*))?)?.*$', "i"), "$1"));
  }
});
define('ember-inspector/adapters/chrome', ['exports', 'ember-inspector/adapters/web-extension'], function (exports, _webExtension) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _webExtension.default.extend({
    name: 'chrome',

    canOpenResource: true,

    openResource: function openResource(file, line) {
      /*global chrome */
      // For some reason it opens the line after the one specified
      chrome.devtools.panels.openResource(file, line - 1);
    },
    onResourceAdded: function onResourceAdded() {
      chrome.devtools.inspectedWindow.onResourceAdded.addListener(function (opts) {
        if (opts.type === 'document') {
          this.sendIframes([opts.url]);
        }
      });
    }
  });
});
define("ember-inspector/adapters/firefox", ["exports", "ember-inspector/adapters/web-extension"], function (exports, _webExtension) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _webExtension.default.extend({
    name: 'firefox'
  });
});
define('ember-inspector/adapters/web-extension', ['exports', 'ember-inspector/adapters/basic', 'ember', 'ember-inspector/config/environment'], function (exports, _basic, _ember, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var computed = _ember.default.computed;


  var emberDebug = null;

  exports.default = _basic.default.extend({
    /**
     * Called when the adapter is created.
     *
     * @method init
     */
    init: function init() {
      this._connect();
      this._handleReload();
      this._injectDebugger();
      return this._super.apply(this, arguments);
    },


    name: 'web-extension',

    sendMessage: function sendMessage(options) {
      options = options || {};
      this.get('_chromePort').postMessage(options);
    },


    _chromePort: computed(function () {
      return chrome.runtime.connect();
    }),

    _connect: function _connect() {
      var _this = this;

      var chromePort = this.get('_chromePort');
      chromePort.postMessage({ appId: chrome.devtools.inspectedWindow.tabId });

      chromePort.onMessage.addListener(function (message) {
        if (typeof message.type === 'string' && message.type === 'iframes') {
          _this.sendIframes(message.urls);
        }
        _this._messageReceived(message);
      });
    },
    _handleReload: function _handleReload() {
      var self = this;
      chrome.devtools.network.onNavigated.addListener(function () {
        self._injectDebugger();
        location.reload(true);
      });
    },
    _injectDebugger: function _injectDebugger() {
      chrome.devtools.inspectedWindow.eval(loadEmberDebug());
      this.onResourceAdded();
    },
    onResourceAdded: function onResourceAdded() /*callback*/{},
    willReload: function willReload() {
      this._injectDebugger();
    },


    /**
     * Open the devtools "Elements" tab and select a specific DOM element.
     *
     * @method inspectDOMElement
     * @param  {String} selector jQuery selector
     */
    inspectDOMElement: function inspectDOMElement(selector) {
      chrome.devtools.inspectedWindow.eval('inspect($(\'' + selector + '\')[0])');
    },


    /**
     * Redirect to the correct inspector version.
     *
     * @method onVersionMismatch
     * @param {String} goToVersion
     */
    onVersionMismatch: function onVersionMismatch(goToVersion) {
      window.location.href = '../panes-' + goToVersion.replace(/\./g, '-') + '/index.html';
    },


    /**
      We handle the reload here so we can inject
      scripts as soon as possible into the new page.
    */
    reloadTab: function reloadTab() {
      chrome.devtools.inspectedWindow.reload({
        injectedScript: loadEmberDebug()
      });
    },


    canOpenResource: false,

    sendIframes: function sendIframes(urls) {
      urls.forEach(function (url) {
        chrome.devtools.inspectedWindow.eval(loadEmberDebug(), { frameURL: url });
      });
    }
  });


  function loadEmberDebug() {
    var minimumVersion = _environment.default.emberVersionsSupported[0].replace(/\./g, '-');
    var xhr = void 0;
    if (!emberDebug) {
      xhr = new XMLHttpRequest();
      xhr.open("GET", chrome.runtime.getURL('/panes-' + minimumVersion + '/ember_debug.js'), false);
      xhr.send();
      emberDebug = xhr.responseText;
    }
    return emberDebug;
  }
});
define("ember-inspector/adapters/websocket", ["exports", "ember", "ember-inspector/adapters/basic"], function (exports, _ember, _basic) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var computed = _ember.default.computed;
  exports.default = _basic.default.extend({
    init: function init() {
      this._super();
      this._connect();
    },
    sendMessage: function sendMessage(options) {
      options = options || {};
      this.get('socket').emit('emberInspectorMessage', options);
    },


    socket: computed(function () {
      return window.EMBER_INSPECTOR_CONFIG.remoteDebugSocket;
    }),

    _connect: function _connect() {
      var _this = this;

      this.get('socket').on('emberInspectorMessage', function (message) {
        _ember.default.run(function () {
          _this._messageReceived(message);
        });
      });
    },
    _disconnect: function _disconnect() {
      this.get('socket').removeAllListeners("emberInspectorMessage");
    },
    willDestroy: function willDestroy() {
      this._disconnect();
    }
  });
});
define('ember-inspector/app', ['exports', 'ember', 'ember-inspector/resolver', 'ember-load-initializers', 'ember-inspector/config/environment', 'ember-inspector/port', 'ember-inspector/libs/promise-assembler'], function (exports, _ember, _resolver, _emberLoadInitializers, _environment, _port, _promiseAssembler) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var version = '2.2.0';

  var App = _ember.default.Application.extend({
    modulePrefix: _environment.default.modulePrefix,
    podModulePrefix: _environment.default.podModulePrefix,
    Resolver: _resolver.default
  });

  // TODO: remove this when fixed
  // problem description: registry classes being registered
  // again on app reset. this will clear the registry.
  // long term solution: make registry initializers run once on app
  // creation.
  // issue: https://github.com/emberjs/ember.js/issues/10310
  // pr: https://github.com/emberjs/ember.js/pull/10597
  App.reopen({
    buildInstance: function buildInstance() {
      this.buildRegistry();
      return this._super.apply(this, arguments);
    }
  });

  _environment.default.VERSION = version;

  // Inject adapter
  App.initializer({
    name: "extension-init",

    initialize: function initialize(instance) {
      // chrome is replaced by the build process.
      instance.adapter = 'chrome';

      // register and inject adapter
      var Adapter = void 0;
      if (_ember.default.typeOf(instance.adapter) === 'string') {
        Adapter = instance.resolveRegistration('adapter:' + instance.adapter);
      } else {
        Adapter = instance.adapter;
      }
      instance.register('adapter:main', Adapter);
      instance.inject('port', 'adapter', 'adapter:main');
      instance.inject('route:application', 'adapter', 'adapter:main');
      instance.inject('route:deprecations', 'adapter', 'adapter:main');
      instance.inject('controller:deprecations', 'adapter', 'adapter:main');

      // register config
      instance.register('config:main', _environment.default, { instantiate: false });
      instance.inject('route', 'config', 'config:main');

      // inject port
      instance.register('port:main', instance.Port || _port.default);
      instance.inject('controller', 'port', 'port:main');
      instance.inject('route', 'port', 'port:main');
      instance.inject('component', 'port', 'port:main');
      instance.inject('promise-assembler', 'port', 'port:main');

      // register and inject promise assembler
      instance.register('promise-assembler:main', _promiseAssembler.default);
      instance.inject('route:promiseTree', 'assembler', 'promise-assembler:main');
    }
  });

  (0, _emberLoadInitializers.default)(App, _environment.default.modulePrefix);

  exports.default = App;
});
define('ember-inspector/components/action-checkbox', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Component = _ember.default.Component;
  exports.default = Component.extend({
    tagName: 'input',
    attributeBindings: ['type', 'checked'],
    type: 'checkbox',

    checked: false,

    change: function change() {
      this._updateElementValue();
    },
    _updateElementValue: function _updateElementValue() {
      this.set('checked', this.element.checked);
      this.sendAction('on-update', this.get('checked'));
    }
  });
});
define('ember-inspector/components/async-image', ['exports', 'ember-async-image/components/async-image'], function (exports, _asyncImage) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _asyncImage.default;
    }
  });
});
define('ember-inspector/components/clear-button', ['exports', 'ember-inspector/components/icon-button'], function (exports, _iconButton) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _iconButton.default.extend({
    title: 'Clear'
  });
});
define('ember-inspector/components/container-instance', ['exports', 'ember', 'ember-inspector/mixins/row-events'], function (exports, _ember, _rowEvents) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Component = _ember.default.Component;
  exports.default = Component.extend(_rowEvents.default, {
    /**
     * No tag
     *
     * @property tagName
     * @type {String}
     */
    tagName: ''
  });
});
define("ember-inspector/components/date-property-field", ["exports", "ember", "ember-inspector/components/pikaday-input"], function (exports, _ember, _pikadayInput) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var on = _ember.default.on,
      once = _ember.default.run.once;

  var KEY_EVENTS = {
    escape: 27
  };

  exports.default = _pikadayInput.default.extend({
    /**
     * Workaround bug of `onPikadayClose` being called
     * on a destroyed component.
     */
    onPikadayClose: function onPikadayClose() {
      if (!this.element) {
        return;
      }
      return this._super.apply(this, arguments);
    },


    openDatePicker: on('didInsertElement', function () {
      once(this.$(), 'click');
    }),

    keyUp: function keyUp(e) {
      if (e.keyCode === KEY_EVENTS.escape) {
        this.sendAction('cancel');
      }
      return this._super.apply(this, arguments);
    }
  });
});
define('ember-inspector/components/deprecation-item-source', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Component = _ember.default.Component,
      computed = _ember.default.computed;
  var bool = computed.bool,
      readOnly = computed.readOnly,
      and = computed.and;
  exports.default = Component.extend({
    /**
     * No tag.
     *
     * @property tagName
     * @type {String}
     */
    tagName: '',

    known: bool('model.map.source'),

    url: computed('model.map.source', 'model.map.line', 'known', function () {
      var source = this.get('model.map.source');
      if (this.get('known')) {
        return source + ':' + this.get('model.map.line');
      } else {
        return 'Unkown source';
      }
    }),

    adapter: readOnly('port.adapter'),

    isClickable: and('known', 'adapter.canOpenResource')
  });
});
define('ember-inspector/components/deprecation-item', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Component = _ember.default.Component,
      computed = _ember.default.computed;
  var notEmpty = computed.notEmpty;
  exports.default = Component.extend({
    isExpanded: true,

    tagName: '',

    hasMap: notEmpty('model.hasSourceMap'),

    actions: {
      toggleExpand: function toggleExpand() {
        this.toggleProperty('isExpanded');
      }
    }
  });
});
define('ember-inspector/components/drag-handle', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var computed = _ember.default.computed,
      htmlSafe = _ember.default.String.htmlSafe;
  exports.default = _ember.default.Component.extend({
    classNames: ['drag-handle'],
    classNameBindings: ['isLeft:drag-handle--left', 'isRight:drag-handle--right', 'faded:drag-handle--faded'],
    attributeBindings: ['style'],
    position: 0,
    side: '',
    isRight: _ember.default.computed.equal('side', 'right'),
    isLeft: _ember.default.computed.equal('side', 'left'),
    minWidth: 60,

    /**
     * The maximum width this handle can be dragged to.
     *
     * @property maxWidth
     * @type {Number}
     * @default Infinity
     */
    maxWidth: Infinity,

    /**
     * The left offset to add to the initial position.
     *
     * @property left
     * @type {Number}
     * @default 0
     */
    left: 0,

    /**
     * Modifier added to the class to fade the drag handle.
     *
     * @property faded
     * @type {Boolean}
     * @default false
     */
    faded: false,

    /**
     * Action to trigger whenever the drag handle is moved.
     * Pass this action through the template.
     *
     * @property on-drag
     * @type {Function}
     */
    'on-drag': function onDrag() {},
    startDragging: function startDragging() {
      var _this = this;

      var $container = this.$().parent();
      var $containerOffsetLeft = $container.offset().left;
      var $containerOffsetRight = $containerOffsetLeft + $container.width();
      var namespace = 'drag-' + this.get('elementId');

      this.sendAction('action', true);

      _ember.default.$('body').on('mousemove.' + namespace, function (e) {
        var position = _this.get('isLeft') ? e.pageX - $containerOffsetLeft : $containerOffsetRight - e.pageX;

        position -= _this.get('left');
        if (position >= _this.get('minWidth') && position <= _this.get('maxWidth')) {
          _this.set('position', position);
          _this.get('on-drag')(position);
        }
      }).on('mouseup.' + namespace + ' mouseleave.' + namespace, function () {
        _this.stopDragging();
      });
    },
    stopDragging: function stopDragging() {
      this.sendAction('action', false);
      _ember.default.$('body').off('.drag-' + this.get('elementId'));
    },
    willDestroyElement: function willDestroyElement() {
      this._super();
      this.stopDragging();
    },
    mouseDown: function mouseDown() {
      this.startDragging();
      return false;
    },


    style: computed('side', 'position', 'left', function () {
      var string = void 0;
      if (this.get('side')) {
        string = this.get('side') + ': ' + (this.get('position') + this.get('left')) + 'px;';
      } else {
        string = '';
      }
      return htmlSafe(string);
    })
  });
});
define('ember-inspector/components/draggable-column', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Component = _ember.default.Component,
      inject = _ember.default.inject;
  var service = inject.service;
  exports.default = Component.extend({
    tagName: '', // Prevent wrapping in a div
    side: 'left',
    minWidth: 60,
    setIsDragging: 'setIsDragging',

    /**
     * Injected `layout` service. Used to broadcast
     * changes the layout of the app.
     *
     * @property layout
     * @type {Service}
     */
    layout: service(),

    /**
     * Trigger that the application dimensions have changed due to
     * something being dragged/resized such as the main nav or the
     * object inspector.
     *
     * @method triggerResize
     */
    triggerResize: function triggerResize() {
      this.get('layout').trigger('resize', { source: 'draggable-column' });
    },


    actions: {
      setIsDragging: function setIsDragging(isDragging) {
        this.sendAction('setIsDragging', isDragging);
      },


      /**
       * Action called whenever the draggable column has been
       * resized.
       *
       * @method didDrag
       */
      didDrag: function didDrag() {
        this.triggerResize();
      }
    }
  });
});
define('ember-inspector/components/icon-button', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Component = _ember.default.Component;
  exports.default = Component.extend({
    attributeBindings: ['title'],

    tagName: 'button',

    title: null,

    click: function click() {
      this.sendAction();
    }
  });
});
define('ember-inspector/components/iframe-picker', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Component = _ember.default.Component,
      computed = _ember.default.computed,
      run = _ember.default.run,
      observer = _ember.default.observer,
      getOwner = _ember.default.getOwner;
  var alias = computed.alias;
  exports.default = Component.extend({
    model: computed('port.detectedApplications.[]', function () {
      return this.get('port.detectedApplications').map(function (val) {
        var name = val.split('__')[1];
        return { name: name, val: val };
      });
    }),

    selectedApp: alias('port.applicationId'),

    selectedDidChange: observer('selectedApp', function () {
      // Change iframe being debugged
      var url = '/';
      var applicationId = this.get('selectedApp');
      var list = this.get('port').get('detectedApplications');
      var app = getOwner(this).lookup('application:main');

      run(app, app.reset);
      var router = app.__container__.lookup('router:main');
      var port = app.__container__.lookup('port:main');
      port.set('applicationId', applicationId);
      port.set('detectedApplications', list);

      // start
      app.boot().then(function () {
        router.location.setURL(url);
        run(app.__deprecatedInstance__, 'handleURL', url);
      });
    }),

    actions: {
      selectIframe: function selectIframe(applicationId) {
        this.set('selectedApp', applicationId);
      }
    }
  });
});
define('ember-inspector/components/in-viewport', ['exports', 'smoke-and-mirrors/components/in-viewport/component'], function (exports, _component) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _component.default;
    }
  });
});
define('ember-inspector/components/main-content', ['exports', 'ember', 'ember-concurrency'], function (exports, _ember, _emberConcurrency) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Component = _ember.default.Component,
      schedule = _ember.default.run.schedule,
      $ = _ember.default.$,
      service = _ember.default.inject.service;
  exports.default = Component.extend({
    /**
     * Layout service. We inject it to keep its `contentHeight` property
     * up-to-date.
     *
     * @property layoutService
     * @type  {Service} layout
     */
    layoutService: service('layout'),

    didInsertElement: function didInsertElement() {
      var _this = this;

      $(window).on('resize.view-' + this.get('elementId'), function () {
        _this.get('updateHeightDebounce').perform();
      });
      schedule('afterRender', this, this.updateHeight);
      return this._super.apply(this, arguments);
    },


    /**
     * Restartable Ember Concurrency task that triggers
     * `updateHeight` after 100ms.
     *
     * @property updateHeightDebounce
     * @type {Object} Ember Concurrency task
     */
    updateHeightDebounce: (0, _emberConcurrency.task)(regeneratorRuntime.mark(function _callee() {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return (0, _emberConcurrency.timeout)(100);

            case 2:
              this.updateHeight();

            case 3:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    })).restartable(),

    /**
     * Update the layout's `contentHeight` property.
     * This will cause the layout service to trigger
     * the `content-height-update` event which will update
     * list heights.
     *
     * This is called initially when this component is inserted
     * and whenever the window is resized.
     *
     * @method updateHeight
     */
    updateHeight: function updateHeight() {
      this.get('layoutService').updateContentHeight(this.$().height());
    },
    willDestroyElement: function willDestroyElement() {
      $(window).off('.view-' + this.get('elementId'));
      return this._super.apply(this, arguments);
    }
  });
});
define('ember-inspector/components/mixin-detail', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var computed = _ember.default.computed,
      Component = _ember.default.Component;
  var readOnly = computed.readOnly;
  exports.default = Component.extend({
    /**
     * mixinDetails controller passed through the template
     *
     * @property mixinDetails
     * @type {Ember.Controller}
     */
    mixinDetails: null,

    objectId: readOnly('mixinDetails.model.objectId'),

    isExpanded: computed('model.expand', 'model.properties.length', function () {
      return this.get('model.expand') && this.get('model.properties.length') > 0;
    }),

    actions: {
      calculate: function calculate(_ref) {
        var name = _ref.name;

        var objectId = this.get('objectId');
        var mixinIndex = this.get('mixinDetails.model.mixins').indexOf(this.get('model'));

        this.get('port').send('objectInspector:calculate', {
          objectId: objectId,
          mixinIndex: mixinIndex,
          property: name
        });
      },
      sendToConsole: function sendToConsole(_ref2) {
        var name = _ref2.name;

        var objectId = this.get('objectId');

        this.get('port').send('objectInspector:sendToConsole', {
          objectId: objectId,
          property: name
        });
      },
      toggleExpanded: function toggleExpanded() {
        this.toggleProperty('isExpanded');
      },
      digDeeper: function digDeeper(_ref3) {
        var name = _ref3.name;

        var objectId = this.get('objectId');

        this.get('port').send('objectInspector:digDeeper', {
          objectId: objectId,
          property: name
        });
      },
      saveProperty: function saveProperty(property, value, dataType) {
        var mixinIndex = this.get('mixinDetails.model.mixins').indexOf(this.get('model'));

        this.get('port').send('objectInspector:saveProperty', {
          objectId: this.get('objectId'),
          property: property,
          value: value,
          mixinIndex: mixinIndex,
          dataType: dataType
        });
      }
    }
  });
});
define('ember-inspector/components/mixin-details', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Component = _ember.default.Component;
  exports.default = Component.extend({
    actions: {
      traceErrors: function traceErrors() {
        this.get('port').send('objectInspector:traceErrors', {
          objectId: this.get('model.objectId')
        });
      }
    }
  });
});
define('ember-inspector/components/mixin-property', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var computed = _ember.default.computed,
      Component = _ember.default.Component;
  var equal = computed.equal,
      alias = computed.alias;
  exports.default = Component.extend({
    isEdit: false,

    /**
     * Passed through the template.
     *
     * The mixin-detail component
     * @type {Ember.Component}
     */
    mixin: null,

    // Bound to editing textbox
    txtValue: null,
    dateValue: null,

    isCalculated: computed('model.value.type', function () {
      return this.get('model.value.type') !== 'type-descriptor';
    }),

    isEmberObject: equal('model.value.type', 'type-ember-object'),

    isComputedProperty: alias('model.value.computed'),

    isFunction: equal('model.value.type', 'type-function'),

    isArray: equal('model.value.type', 'type-array'),

    isDate: equal('model.value.type', 'type-date'),

    _parseTextValue: function _parseTextValue(value) {
      var parsedValue = void 0;
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        // if surrounded by quotes, remove quotes
        var match = value.match(/^"(.*)"$/);
        if (match && match.length > 1) {
          parsedValue = match[1];
        } else {
          parsedValue = value;
        }
      }
      return parsedValue;
    },


    actions: {
      valueClick: function valueClick() {
        if (this.get('isEmberObject') || this.get('isArray')) {
          this.get('mixin').send('digDeeper', this.get('model'));
          return;
        }

        if (this.get('isComputedProperty') && !this.get('isCalculated')) {
          this.get('mixin').send('calculate', this.get('model'));
          return;
        }

        if (this.get('isFunction') || this.get('model.overridden') || this.get('model.readOnly')) {
          return;
        }

        var value = this.get('model.value.inspect');
        var type = this.get('model.value.type');
        if (type === 'type-string') {
          value = '"' + value + '"';
        }
        if (!this.get('isDate')) {
          this.set('txtValue', value);
        } else {
          this.set('dateValue', new Date(value));
        }
        this.set('isEdit', true);
      },
      saveProperty: function saveProperty() {
        var realValue = void 0,
            dataType = void 0;
        if (!this.get('isDate')) {
          realValue = this._parseTextValue(this.get('txtValue'));
        } else {
          realValue = this.get('dateValue').getTime();
          dataType = 'date';
        }
        this.get('mixin').send('saveProperty', this.get('model.name'), realValue, dataType);
      },
      finishedEditing: function finishedEditing() {
        this.set('isEdit', false);
      },
      dateSelected: function dateSelected(val) {
        this.set('dateValue', val);
        this.send('saveProperty');
        this.send('finishedEditing');
      }
    }
  });
});
define('ember-inspector/components/object-inspector', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Component = _ember.default.Component,
      computed = _ember.default.computed;

  var get = _ember.default.get;
  exports.default = Component.extend({
    tagName: '',

    /**
     * Application Controller passed
     * through the template
     *
     * @property application
     * @type {Controller}
     */
    application: null,

    trail: computed('model.[]', function () {
      var nested = this.get('model').slice(1);
      if (nested.length === 0) {
        return "";
      }
      return '.' + nested.mapBy('property').join(".");
    }),

    isNested: computed('model.[]', function () {
      return this.get('model.length') > 1;
    }),

    actions: {
      popStack: function popStack() {
        if (this.get('isNested')) {
          this.get('application').popMixinDetails();
        }
      },
      sendObjectToConsole: function sendObjectToConsole(obj) {
        var objectId = get(obj, 'objectId');
        this.get('port').send('objectInspector:sendToConsole', {
          objectId: objectId
        });
      },
      toggleInspector: function toggleInspector() {
        this.sendAction.apply(this, ['toggleInspector'].concat(Array.prototype.slice.call(arguments)));
      }
    }
  });
});
define('ember-inspector/components/occludable-area', ['exports', 'smoke-and-mirrors/components/occludable-area/component'], function (exports, _component) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _component.default;
    }
  });
});
define('ember-inspector/components/pikaday-input', ['exports', 'ember', 'ember-pikaday/components/pikaday-input'], function (exports, _ember, _pikadayInput) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _pikadayInput.default;
});
define('ember-inspector/components/pikaday-inputless', ['exports', 'ember-pikaday/components/pikaday-inputless'], function (exports, _pikadayInputless) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _pikadayInputless.default;
    }
  });
});
define('ember-inspector/components/pre-render', ['exports', 'smoke-and-mirrors/components/pre-render/component'], function (exports, _component) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _component.default;
    }
  });
});
define('ember-inspector/components/promise-item', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Component = _ember.default.Component,
      computed = _ember.default.computed,
      htmlSafe = _ember.default.String.htmlSafe,
      isEmpty = _ember.default.isEmpty;
  var notEmpty = computed.notEmpty,
      gt = computed.gt,
      equal = computed.equal;


  var COLOR_MAP = {
    red: '#ff2717',
    blue: '#174fff',
    green: '#006400'
  };

  exports.default = Component.extend({
    tagName: '',

    filter: null,
    effectiveSearch: null,

    isError: equal('model.reason.type', 'type-error'),

    style: computed('model.state', function () {
      var color = '';
      if (this.get('model.isFulfilled')) {
        color = 'green';
      } else if (this.get('model.isRejected')) {
        color = 'red';
      } else {
        color = 'blue';
      }
      return htmlSafe('background-color: ' + COLOR_MAP[color] + '; color: white;');
    }),

    nodeStyle: computed('model.state', 'filter', 'effectiveSearch', function () {
      var relevant = void 0;
      switch (this.get('filter')) {
        case 'pending':
          relevant = this.get('model.isPending');
          break;
        case 'rejected':
          relevant = this.get('model.isRejected');
          break;
        case 'fulfilled':
          relevant = this.get('model.isFulfilled');
          break;
        default:
          relevant = true;
      }
      if (relevant && !isEmpty(this.get('effectiveSearch'))) {
        relevant = this.get('model').matchesExactly(this.get('effectiveSearch'));
      }
      if (!relevant) {
        return 'opacity: 0.3;';
      } else {
        return '';
      }
    }),

    labelStyle: computed('model.level', 'nodeStyle', function () {
      return htmlSafe('padding-left: ' + (+this.get('model.level') * 20 + 5) + 'px;' + this.get('nodeStyle'));
    }),

    expandedClass: computed('hasChildren', 'model.isExpanded', function () {
      if (!this.get('hasChildren')) {
        return;
      }

      if (this.get('model.isExpanded')) {
        return 'list__cell_arrow_expanded';
      } else {
        return 'list__cell_arrow_collapsed';
      }
    }),

    hasChildren: gt('model.children.length', 0),

    settledValue: computed('model.value', function () {
      if (this.get('model.isFulfilled')) {
        return this.get('model.value');
      } else if (this.get('model.isRejected')) {
        return this.get('model.reason');
      } else {
        return '--';
      }
    }),

    isValueInspectable: notEmpty('settledValue.objectId'),

    hasValue: computed('settledValue', 'model.isSettled', function () {
      return this.get('model.isSettled') && this.get('settledValue.type') !== 'type-undefined';
    }),

    label: computed('model.label', function () {
      return this.get('model.label') || !!this.get('model.parent') && 'Then' || '<Unknown Promise>';
    }),

    state: computed('model.state', function () {
      if (this.get('model.isFulfilled')) {
        return 'Fulfilled';
      } else if (this.get('model.isRejected')) {
        return 'Rejected';
      } else if (this.get('model.parent') && !this.get('model.parent.isSettled')) {
        return 'Waiting for parent';
      } else {
        return 'Pending';
      }
    }),

    timeToSettle: computed('model.createdAt', 'model.settledAt', 'model.parent.settledAt', function () {
      if (!this.get('model.createdAt') || !this.get('model.settledAt')) {
        return ' -- ';
      }
      var startedAt = this.get('model.parent.settledAt') || this.get('model.createdAt');
      var remaining = this.get('model.settledAt').getTime() - startedAt.getTime();
      return remaining;
    })
  });
});
define('ember-inspector/components/property-field', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _ember.default.TextField.extend({
    attributeBindings: ['label:data-label'],

    /**
     * The property-component instance.
     * Passed through the template.
     *
     * @property propertyComponent
     * @type {Ember.Component}
     */
    properyComponent: null,

    didInsertElement: function didInsertElement() {
      this.$().select();
      return this._super.apply(this, arguments);
    },
    insertNewline: function insertNewline() {
      this.get('propertyComponent').send(this.get('save-property'));
      this.get('propertyComponent').send(this.get('finished-editing'));
    },
    cancel: function cancel() {
      this.get('propertyComponent').send(this.get('finished-editing'));
    },
    focusOut: function focusOut() {
      this.get('propertyComponent').send(this.get('finished-editing'));
    }
  });
});
define('ember-inspector/components/record-filter', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var computed = _ember.default.computed,
      Component = _ember.default.Component;
  exports.default = Component.extend({
    filterValue: null,
    checked: computed('filterValue', 'model.name', function () {
      return this.get('filterValue') === this.get('model.name');
    })
  });
});
define('ember-inspector/components/record-item', ['exports', 'ember', 'ember-inspector/mixins/row-events'], function (exports, _ember, _rowEvents) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Component = _ember.default.Component,
      computed = _ember.default.computed,
      htmlSafe = _ember.default.String.htmlSafe,
      isEmpty = _ember.default.isEmpty;

  var COLOR_MAP = {
    red: '#ff2717',
    blue: '#174fff',
    green: '#006400'
  };

  exports.default = Component.extend(_rowEvents.default, {
    /**
     * No tag. This component should not affect
     * the DOM.
     *
     * @property tagName
     * @type {String}
     * @default ''
     */
    tagName: '',

    modelTypeColumns: null,

    /**
     * The index of the current row. Currently used for the
     * `RowEvents` mixin. This property is passed through
     * the template.
     *
     * @property index
     * @type {Number}
     * @default null
     */
    index: null,

    // TODO: Color record based on `color` property.
    style: computed('model.color', function () {
      var string = '';
      var colorName = this.get('model.color');
      if (!isEmpty(colorName)) {
        var color = COLOR_MAP[colorName];
        if (color) {
          string = 'color: ' + color + ';';
        }
      }
      return htmlSafe(string);
    }),

    columns: computed('modelTypeColumns.[]', 'model.columnValues', function () {
      var _this = this;

      var columns = this.get('modelTypeColumns') || [];
      return columns.map(function (col) {
        return { name: col.name, value: _this.get('model.columnValues.' + col.name) };
      });
    })
  });
});
define('ember-inspector/components/reload-button', ['exports', 'ember-inspector/components/icon-button'], function (exports, _iconButton) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _iconButton.default.extend({
    title: 'Reload'
  });
});
define('ember-inspector/components/render-item', ['exports', 'ember', 'ember-inspector/utils/escape-reg-exp'], function (exports, _ember, _escapeRegExp) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Component = _ember.default.Component,
      computed = _ember.default.computed,
      isEmpty = _ember.default.isEmpty,
      isNone = _ember.default.isNone,
      run = _ember.default.run,
      on = _ember.default.on,
      observer = _ember.default.observer,
      htmlSafe = _ember.default.String.htmlSafe;
  var gt = computed.gt;
  var once = run.once;
  exports.default = Component.extend({
    tagName: '',

    search: null,

    isExpanded: false,

    expand: function expand() {
      this.set('isExpanded', true);
    },


    searchChanged: on('init', observer('search', function () {
      var search = this.get('search');
      if (!isEmpty(search)) {
        once(this, 'expand');
      }
    })),

    searchMatch: computed('search', 'name', function () {
      var search = this.get('search');
      if (isEmpty(search)) {
        return true;
      }
      var name = this.get('model.name');
      var regExp = new RegExp((0, _escapeRegExp.default)(search.toLowerCase()));
      return !!name.toLowerCase().match(regExp);
    }),

    nodeStyle: computed('searchMatch', function () {
      var style = '';
      if (!this.get('searchMatch')) {
        style = 'opacity: 0.5;';
      }
      return htmlSafe(style);
    }),

    level: computed('target.level', function () {
      var parentLevel = this.get('target.level');
      if (isNone(parentLevel)) {
        parentLevel = -1;
      }
      return parentLevel + 1;
    }),

    nameStyle: computed('level', function () {
      return htmlSafe('padding-left: ' + (+this.get('level') * 20 + 5) + 'px;');
    }),

    hasChildren: gt('model.children.length', 0),

    expandedClass: computed('hasChildren', 'isExpanded', function () {
      if (!this.get('hasChildren')) {
        return;
      }

      if (this.get('isExpanded')) {
        return 'list__cell_arrow_expanded';
      } else {
        return 'list__cell_arrow_collapsed';
      }
    }),

    readableTime: computed('model.timestamp', function () {
      var d = new Date(this.get('model.timestamp'));
      var ms = d.getMilliseconds();
      var seconds = d.getSeconds();
      var minutes = d.getMinutes().toString().length === 1 ? '0' + d.getMinutes() : d.getMinutes();
      var hours = d.getHours().toString().length === 1 ? '0' + d.getHours() : d.getHours();

      return hours + ':' + minutes + ':' + seconds + ':' + ms;
    }),

    actions: {
      toggleExpand: function toggleExpand() {
        this.toggleProperty('isExpanded');
      }
    }
  });
});
define('ember-inspector/components/resizable-column', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Component = _ember.default.Component,
      computed = _ember.default.computed,
      htmlSafe = _ember.default.String.htmlSafe;
  exports.default = Component.extend({
    width: null,

    attributeBindings: ['style'],

    style: computed('width', function () {
      return htmlSafe('-webkit-flex: none; flex: none; width: ' + this.get('width') + 'px;');
    }),

    didInsertElement: function didInsertElement() {
      if (!this.get('width')) {
        this.set('width', this.$().width());
      }
    }
  });
});
define('ember-inspector/components/route-item', ['exports', 'ember', 'ember-inspector/utils/check-current-route'], function (exports, _ember, _checkCurrentRoute) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Component = _ember.default.Component,
      computed = _ember.default.computed,
      htmlSafe = _ember.default.String.htmlSafe;
  exports.default = Component.extend({
    // passed as an attribute to the component
    currentRoute: null,

    /**
     * No tag. This component should not affect
     * the DOM.
     *
     * @property tagName
     * @type {String}
     * @default ''
     */
    tagName: '',

    labelStyle: computed('model.parentCount', function () {
      return htmlSafe('padding-left: ' + (+this.get('model.parentCount') * 20 + 5) + 'px;');
    }),

    isCurrent: computed('currentRoute', 'model.value.name', function () {
      var currentRoute = this.get('currentRoute');
      if (!currentRoute) {
        return false;
      }

      return (0, _checkCurrentRoute.default)(currentRoute, this.get('model.value.name'));
    })
  });
});
define('ember-inspector/components/send-to-console', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _ember.default.Component.extend({
    tagName: 'button',
    classNames: ['send-to-console', 'js-send-to-console-btn'],
    action: 'sendValueToConsole',
    click: function click() {
      this.sendAction('action', this.get('param'));
    }
  });
});
define('ember-inspector/components/sidebar-toggle', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _ember.default.Component.extend({

    tagName: 'button',

    side: 'right',

    isExpanded: false,

    isRight: _ember.default.computed.equal('side', 'right'),

    classNames: 'sidebar-toggle',

    classNameBindings: 'isRight:sidebar-toggle--right:sidebar-toggle--left',

    click: function click() {
      this.sendAction();
    }
  });
});
define('ember-inspector/components/vertical-collection', ['exports', 'smoke-and-mirrors/components/vertical-collection/component'], function (exports, _component) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _component.default;
    }
  });
});
define('ember-inspector/components/vertical-item', ['exports', 'smoke-and-mirrors/components/vertical-item/component'], function (exports, _component) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _component.default;
    }
  });
});
define('ember-inspector/components/view-item', ['exports', 'ember', 'ember-inspector/mixins/row-events'], function (exports, _ember, _rowEvents) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var computed = _ember.default.computed,
      Component = _ember.default.Component,
      htmlSafe = _ember.default.String.htmlSafe;
  var not = computed.not,
      bool = computed.bool,
      equal = computed.equal;
  exports.default = Component.extend(_rowEvents.default, {
    /**
     * No tag. This component should not affect
     * the DOM.
     *
     * @property tagName
     * @type {String}
     * @default ''
     */
    tagName: '',

    /**
     * Has a view (component) instance.
     *
     * @property hasView
     * @type {Boolean}
     */
    hasView: bool('model.value.viewClass'),

    /**
     * Whether it has a tag or not.
     *
     * @property isTagless
     * @type {Boolean}
     */
    isTagless: equal('model.value.tagName', ''),

    /**
     * Whether it has an element or not (depends on the tagName).
     *
     * @property hasElement
     * @type {Boolean}
     */
    hasElement: not('isTagless'),

    /**
     * Whether it has a layout/template or not.
     *
     * @property hasTemplate
     * @type {Boolean}
     */
    hasTemplate: bool('model.value.template'),

    hasModel: bool('model.value.model'),

    hasController: bool('model.value.controller'),

    /**
     * The index of the current row. Currently used for the
     * `RowEvents` mixin. This property is passed through
     * the template.
     *
     * @property index
     * @type {Number}
     * @default null
     */
    index: null,

    modelInspectable: computed('hasModel', 'model.value.model.type', function () {
      return this.get('hasModel') && this.get('model.value.model.type') === 'type-ember-object';
    }),

    labelStyle: computed('model.parentCount', function () {
      return htmlSafe('padding-left: ' + (+this.get('model.parentCount') * 20 + 5) + 'px;');
    }),

    actions: {
      inspectView: function inspectView() {
        if (this.get('hasView')) {
          this.sendAction('inspect', this.get('model.value.objectId'));
        }
      },
      inspectElement: function inspectElement(objectId) {
        var elementId = void 0;
        if (!objectId && this.get('hasElement')) {
          objectId = this.get('model.value.objectId');
        }
        if (!objectId) {
          elementId = this.get('model.value.elementId');
        }
        if (objectId || elementId) {
          this.sendAction('inspectElement', { objectId: objectId, elementId: elementId });
        }
      },
      inspectModel: function inspectModel(objectId) {
        if (this.get('modelInspectable')) {
          this.sendAction('inspect', objectId);
        }
      }
    }
  });
});
define('ember-inspector/components/x-app', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Component = _ember.default.Component,
      not = _ember.default.computed.not;
  exports.default = Component.extend({
    classNames: ['app'],

    classNameBindings: ['inactive', 'isDragging'],

    attributeBindings: ['tabindex'],
    tabindex: 1,

    isDragging: false,

    /**
     * Bound to application controller.
     *
     * @property active
     * @type {Boolean}
     * @default false
     */
    active: false,

    inactive: not('active'),

    focusIn: function focusIn() {
      if (!this.get('active')) {
        this.set('active', true);
      }
    },
    focusOut: function focusOut() {
      if (this.get('active')) {
        this.set('active', false);
      }
    }
  });
});
define('ember-inspector/components/x-list-cell', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Component = _ember.default.Component,
      computed = _ember.default.computed,
      htmlSafe = _ember.default.String.htmlSafe;
  exports.default = Component.extend({
    /**
     * Defaults to a table cell. For headers
     * set it to `th` by passing it through the
     * template.
     *
     * @property tagName
     * @type {String}
     * @default 'td'
     */
    tagName: 'td',

    /**
     * @property classNames
     * @type {Array}
     */
    classNames: ['list__cell'],

    /**
     * `highlight` and `clickable` or class modifiers.
     *
     * @property classNameBindings
     * @type {Array}
     */
    classNameBindings: ['highlight:list__cell_highlight', 'clickable:list__cell_clickable'],

    /**
     * Style passed through the `style` property
     * should end up as the DOM element's style.
     * Same applies to the `title` attribute.
     *
     * @property attributeBindings
     * @type {Array}
     */
    attributeBindings: ['safeStyle:style', 'title'],

    /**
     * Avoid unsafe style warning. This property does not
     * depend on user input so this is safe.
     *
     * @property safeStyle
     * @type {SafeString}
     */
    safeStyle: computed('style', function () {
      return htmlSafe(this.get('style'));
    }),

    /**
     * The `title` attribute of the DOM element.
     *
     * @property title
     * @type {String}
     * @default null
     */
    title: null,

    /**
     * The `style` attribute of the DOM element.
     *
     * @property style
     * @type {String}
     * @default null
     */
    style: null,

    /**
     * Cells can be clickable. One example would be clicking Data records to
     * inspect them in the object inspector. Set this property to `true` to
     * make this cell appear clickable (pointer cursor, underline...).
     *
     * @property clickable
     * @type {Boolean}
     * @default false
     */
    clickable: false,

    /**
     * Set this property to `true` to highlight the cell. For example
     * the current route in the Routes tab is highlighted.
     *
     * @property highlight
     * @type {Boolean}
     * @default false
     */
    highlight: false,

    /**
     * Action to trigger when the cell is clicked.
     * Pass the action through the template using the `action`
     * helper.
     *
     * @property on-click
     * @type {Function}
     */
    'on-click': function onClick() {},


    /**
     * DOM event triggered when cell is clicked.
     * Calls the `on-click` action (if set).
     *
     * @method click
     */
    click: function click() {
      this.get('on-click')();
    }
  });
});
define('ember-inspector/components/x-list-content', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Component = _ember.default.Component,
      computed = _ember.default.computed,
      htmlSafe = _ember.default.String.htmlSafe,
      Evented = _ember.default.Evented,
      run = _ember.default.run,
      EmberObject = _ember.default.Object,
      inject = _ember.default.inject;
  var schedule = run.schedule;
  var service = inject.service;
  exports.default = Component.extend(Evented, {
    /**
     * The layout service. Used to observe the app's content height.
     *
     * @property layoutService
     * @type {Service}
     */
    layoutService: service('layout'),

    /**
     * @property classNames
     * @type {Array}
     */
    classNames: ["list__content", "js-list-content"],

    /**
     * Hook called when content element is inserted.
     * Used to setup event listeners to work-around
     * smoke-and-mirrors lack of events.
     *
     * @method didInsertElement
     */
    didInsertElement: function didInsertElement() {
      schedule('afterRender', this, this.setupHeight);
      schedule('afterRender', this, this.setupEvents);
    },


    /**
     * Set up the content height and listen to any updates to that property.
     *
     * @method setupHeight
     */
    setupHeight: function setupHeight() {
      this.set('contentHeight', this.get('layoutService.contentHeight'));
      this.get('layoutService').on('content-height-update', this, this.updateContentHeight);
    },


    /**
     * Triggered whenever the app's content height changes. This usually happens
     * when the window is resized. Once we detect a change we:
     * 1. Update this component's `contentHeight` property and consequently its `height` style.
     * 2. Check the previous height. If previous height was zero that means the inspector launched
     * in the background and was therefore not visible. Go to (a). Otherwise skip (a).
     *   a. Rerender the component. This is needed because smoke and mirrors doesn't know that the content height
     *   has changed.
     *
     * @method updateContentHeight
     * @param  {Number} height The app's new content height
     */
    updateContentHeight: function updateContentHeight(height) {
      var previousHeight = this.get('contentHeight');
      this.set('contentHeight', height);
      if (previousHeight === 0 && height > 0) {
        this.rerender();
      }
    },


    /**
     * Set up event listening on the individual rows in the table.
     * Rows can listen to these events by listening to events on the `rowEvents`
     * property.
     *
     * @method setupEvents
     */
    setupEvents: function setupEvents() {
      this.set('rowEvents', EmberObject.extend(Evented).create());
      var cb = run.bind(this, 'triggerRowEvent');
      var listContentElement = this.element;
      // Delegated event handler for click on rows
      this.element.addEventListener('click', function (e) {
        var tr = e.target.closest('tr');
        if (!tr || !e.currentTarget.contains(tr)) {
          return;
        }
        cb(e.type, tr);
      });

      // Delegated event handler for mouseenter/leave on rows.
      // Since mouseenter/leave do not bubble, these event handlers simulate it using
      // `mouseover`/`mouseout`.
      this.element.addEventListener('mouseover', simulateMouseEvent('mouseenter'));
      this.element.addEventListener('mouseout', simulateMouseEvent('mouseleave'));

      function simulateMouseEvent(eventName) {
        return function (e) {
          var target = e.target;
          var related = e.relatedTarget;
          var match = void 0;
          // search for a parent node matching the delegation selector
          while (target && target !== listContentElement && !(match = target.matches('tr'))) {
            target = target.parentNode;
          }
          // exit if no matching node has been found
          if (!match) {
            return;
          }

          // loop through the parent of the related target to make sure that it's not a child of the target
          while (related && related !== target && related !== document) {
            related = related.parentNode;
          }

          // exit if this is the case
          if (related === target) {
            return;
          }

          cb(eventName, target);
        };
      }
    },


    /**
     * Hook called before destruction. Clean up events listeners.
     *
     * @method willDestroyElement
     */
    willDestroyElement: function willDestroyElement() {
      this.get('layoutService').off('content-height-update', this, this.updateContentHeight);
      return this._super.apply(this, arguments);
    },


    /**
     * Broadcasts that an event was triggered on a row.
     *
     * @method triggerRowEvent
     * @param {String} type The event type to trigger
     * @param {DOMElement} row The element the event was triggered on
     */
    triggerRowEvent: function triggerRowEvent(type, row) {
      var index = [].indexOf.call(row.parentNode.children, row);
      this.get('rowEvents').trigger(type, { index: index, type: type });
    },


    attributeBindings: ['style'],

    style: computed('height', function () {
      return htmlSafe('height:' + this.get('height') + 'px');
    }),

    /**
     * Array of objects representing the columns to render
     * and their corresponding widths. This array is passed
     * through the template.
     *
     * Each item in the array has `width` and `id` properties.
     *
     * @property columns
     * @type {Array}
     */
    columns: computed(function () {
      return [];
    }),

    /**
     * Number passed from `x-list`. Indicates the header height
     * in pixels.
     *
     * @property headerHeight
     * @type {Number}
     */
    headerHeight: null,

    /**
     * @property height
     * @type {Integer}
     */
    height: computed('contentHeight', 'headerHeight', function () {
      var headerHeight = this.get('headerHeight');
      var contentHeight = this.get('contentHeight');

      // In testing list-view is created before `contentHeight` is set
      // which will trigger an exception
      if (!contentHeight) {
        return 1;
      }
      return contentHeight - headerHeight;
    })
  });
});
define('ember-inspector/components/x-list', ['exports', 'ember', 'ember-concurrency', 'ember-inspector/libs/resizable-columns', 'ember-inspector/services/storage/local'], function (exports, _ember, _emberConcurrency, _resizableColumns, _local) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Component = _ember.default.Component,
      run = _ember.default.run,
      computed = _ember.default.computed,
      inject = _ember.default.inject,
      $ = _ember.default.$;
  var scheduleOnce = run.scheduleOnce;
  var service = inject.service;
  var readOnly = computed.readOnly,
      reads = computed.reads;


  var CHECK_HTML = '&#10003;';

  exports.default = Component.extend({
    /**
     * @property classNames
     * @type {Array}
     */
    classNames: ['list'],

    /**
     * Class to pass to each row in `vertical-collection`.
     *
     * @property itemClass
     * @type {String}
     * @default ''
     */
    itemClass: '',

    /**
     * Layout service used to listen to changes to the application
     * layout such as resizing of the main nav or object inspecto.
     *
     * @property layout
     * @type {Service}
     */
    layout: service(),

    /**
     * Indicate the table's header's height in pixels.
     * Set this to `0` when there's no header.
     *
     * @property headerHeight
     * @type {Number}
     * @default 31
     */
    headerHeight: 31,

    /**
     * The name of the list. Used for `js-` classes added
     * to elements of the list. Also used as the default
     * key for schema caching.
     *
     * @property name
     * @type {String}
     */
    name: null,

    /**
     * Service used for storage. Storage is
     * needed for caching of widths and visibility of columns.
     * The default storage service is local storage however we
     * fall back to memory storage if local storage is disabled (For
     * example as a security setting in Chrome).
     *
     * @property storage
     * @return {Service}
     */
    storage: service('storage/' + (_local.default.SUPPORTED ? 'local' : 'memory')),

    /**
     * The key used to cache the current schema. Defaults
     * to the list's name.
     *
     * @property storageKey
     * @type {String}
     */
    storageKey: reads('name'),

    /**
     * The schema that contains the list's columns,
     * their ids, names, and default visibility.
     *
     * @property schema
     * @type {Object}
     */
    schema: null,

    /**
     * The array of columns including their ids, names,
     * and widths. This array only contains the currently
     * visible columns.
     *
     * @property columns
     * @type {Array}
     */
    columns: readOnly('resizableColumns.columns'),

    /**
     * Hook called whenever attributes are updated.
     * We use this to listen to changes to the schema.
     * If the schema changes for an existing `x-list` component
     * (happens when switching model types for example), we need
     * to rebuild the columns from scratch.
     *
     * @method didUpdateAttrs
     * @param  {Object} newAttrs and oldAttrs
     */
    didUpdateAttrs: function didUpdateAttrs() {
      var oldSchema = this.get('oldSchema');
      var newSchema = this.get('schema');
      if (newSchema && newSchema !== oldSchema) {
        scheduleOnce('actions', this, this.setupColumns);
      }
      this.set('oldSchema', newSchema);
      return this._super.apply(this, arguments);
    },


    /**
     * The instance responsible for building the `columns`
     * array. This means that this instance controls
     * the widths of the columns as well as their visibility.
     *
     * @property resizableColumns
     * @type {ResizableColumn}
     */
    resizableColumns: null,

    /**
     * The minimum width a column can be resized to.
     * It should be high enough so that the column is still
     * visible and resizable.
     *
     * @property minWidth
     * @type {Number}
     * @default 10
     */
    minWidth: 10,

    didInsertElement: function didInsertElement() {
      var _this = this;

      scheduleOnce('afterRender', this, this.setupColumns);
      this.onResize = function () {
        _this.get('debounceColumnWidths').perform();
      };
      $(window).on('resize.' + this.get('elementId'), this.onResize);
      this.get('layout').on('resize', this.onResize);
      return this._super.apply(this, arguments);
    },


    /**
     * Setup the context menu which allows the user
     * to toggle the visibility of each column.
     *
     * The context menu opened by right clicking on the table's
     * header.
     *
     * @method setupContextMenu
     */
    setupContextMenu: function setupContextMenu() {
      var _this2 = this;

      var menu = this.resizableColumns.getColumnVisibility().reduce(function (arr, _ref) {
        var id = _ref.id,
            name = _ref.name,
            visible = _ref.visible;

        var check = '' + CHECK_HTML;
        if (!visible) {
          check = '<span style=\'opacity:0\'>' + check + '</span>';
        }
        name = check + ' ' + name;
        arr.push({
          name: name,
          title: name,
          fun: run.bind(_this2, _this2.toggleColumnVisibility, id)
        });
        return arr;
      }, []);

      this.$('.list__header').contextMenu(menu, { triggerOn: 'contextmenu' });
    },


    /**
     * Toggle a column's visibility. This is called
     * when a user clicks on a specific column in the context
     * menu. After toggling visibility it destroys the current
     * context menu and rebuilds it with the updated column data.
     *
     * @method toggleColumnVisibility
     * @param {String} id The column's id
     */
    toggleColumnVisibility: function toggleColumnVisibility(id) {
      this.resizableColumns.toggleVisibility(id);
      this.$('.list__header').contextMenu('destroy');
      this.setupContextMenu();
    },


    /**
     * Restartable `ember-concurrency` task called whenever
     * the table widths need to be recalculated due to some
     * resizing of the window or application.
     *
     * @property debounceColumnWidths
     * @type {Object} Ember Concurrency task
     */
    debounceColumnWidths: (0, _emberConcurrency.task)(regeneratorRuntime.mark(function _callee() {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return (0, _emberConcurrency.timeout)(100);

            case 2:
              this.resizableColumns.setTableWidth(this.getTableWidth());

            case 3:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    })).restartable(),

    /**
     * Hook called when the component element will be destroyed.
     * Clean up everything.
     *
     * @method willDestroyElement
     */
    willDestroyElement: function willDestroyElement() {
      _ember.default.$(window).off('.' + this.get('elementId'));
      this.$('.list__header').contextMenu('destroy');
      this.get('layout').off('resize', this.onResize);
      return this._super.apply(this, arguments);
    },


    /**
     * Returns the table's width in pixels.
     *
     * @method getTableWidth
     * @return {Number} The width in pixels
     */
    getTableWidth: function getTableWidth() {
      return this.$('.list__table-container').innerWidth();
    },


    /**
     * Creates a new `ResizableColumns` instance which
     * will calculate the columns' width and visibility.
     *
     * @method setupColumns
     */
    setupColumns: function setupColumns() {
      var resizableColumns = new _resizableColumns.default({
        key: this.get('storageKey'),
        tableWidth: this.getTableWidth(),
        minWidth: this.get('minWidth'),
        storage: this.get('storage'),
        columnSchema: this.get('schema.columns') || []
      });
      resizableColumns.build();
      this.set('resizableColumns', resizableColumns);
      this.setupContextMenu();
    },


    actions: {
      /**
       * Called whenever a column is resized using the draggable handle.
       * It is responsible for updating the column info by notifying
       * `resizableColumns` about the update.
       *
       * @method didResize
       * @param {String} id The column's id
       * @param {Number} width The new width
       */
      didResize: function didResize(id, width) {
        this.resizableColumns.updateColumnWidth(id, width);
      }
    }
  });
});
define("ember-inspector/computed/debounce", ["exports", "ember", "ember-new-computed"], function (exports, _ember, _emberNewComputed) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (prop, delay, callback) {
    var value = void 0;

    var updateVal = function updateVal() {
      this.set(prop, value);
      if (callback) {
        callback.call(this);
      }
    };

    return (0, _emberNewComputed.default)({
      get: function get() {},
      set: function set(key, val) {
        value = val;
        debounce(this, updateVal, delay);
        return val;
      }
    });
  };

  var run = _ember.default.run;
  var debounce = run.debounce;
});
define('ember-inspector/controllers/application', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Controller = _ember.default.Controller,
      computed = _ember.default.computed,
      equal = _ember.default.computed.equal;
  exports.default = Controller.extend({
    isDragging: false,
    contentHeight: null,
    emberApplication: false,
    navWidth: 180,
    inspectorWidth: 360,
    mixinStack: computed(function () {
      return [];
    }),
    mixinDetails: computed(function () {
      return [];
    }),
    isChrome: equal('port.adapter.name', 'chrome'),

    deprecationCount: 0,

    // Indicates that the extension window is focused,
    active: true,

    inspectorExpanded: false,

    pushMixinDetails: function pushMixinDetails(name, property, objectId, details, errors) {
      details = {
        name: name,
        property: property,
        objectId: objectId,
        mixins: details,
        errors: errors
      };

      this.get('mixinStack').pushObject(details);
      this.set('mixinDetails', details);
    },
    popMixinDetails: function popMixinDetails() {
      var mixinStack = this.get('mixinStack');
      var item = mixinStack.popObject();
      this.set('mixinDetails', mixinStack.get('lastObject'));
      this.get('port').send('objectInspector:releaseObject', { objectId: item.objectId });
    },
    activateMixinDetails: function activateMixinDetails(name, objectId, details, errors) {
      var _this = this;

      this.get('mixinStack').forEach(function (item) {
        _this.get('port').send('objectInspector:releaseObject', { objectId: item.objectId });
      });

      this.set('mixinStack', []);
      this.pushMixinDetails(name, undefined, objectId, details, errors);
    },
    droppedObject: function droppedObject(objectId) {
      var mixinStack = this.get('mixinStack');
      var obj = mixinStack.findBy('objectId', objectId);
      if (obj) {
        var index = mixinStack.indexOf(obj);
        var objectsToRemove = [];
        for (var i = index; i >= 0; i--) {
          objectsToRemove.pushObject(mixinStack.objectAt(i));
        }
        objectsToRemove.forEach(function (item) {
          mixinStack.removeObject(item);
        });
      }
      if (mixinStack.get('length') > 0) {
        this.set('mixinDetails', mixinStack.get('lastObject'));
      } else {
        this.set('mixinDetails', null);
      }
    }
  });
});
define("ember-inspector/controllers/container-type", ["exports", "ember", "ember-inspector/computed/debounce", "ember-inspector/utils/search-match"], function (exports, _ember, _debounce, _searchMatch) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Controller = _ember.default.Controller,
      computed = _ember.default.computed,
      get = _ember.default.get,
      controller = _ember.default.inject.controller;
  var filter = computed.filter;
  exports.default = Controller.extend({
    application: controller(),

    sortProperties: ['name'],

    searchVal: (0, _debounce.default)('search', 300),

    search: null,

    filtered: filter('model', function (item) {
      return (0, _searchMatch.default)(get(item, 'name'), this.get('search'));
    }).property('model.@each.name', 'search'),

    actions: {
      /**
       * Inspect an instance in the object inspector.
       * Called whenever an item in the list is clicked.
       *
       * @method inspectInstance
       * @param {Object} obj
       */
      inspectInstance: function inspectInstance(obj) {
        if (!get(obj, 'inspectable')) {
          return;
        }
        this.get('port').send('objectInspector:inspectByContainerLookup', { name: get(obj, 'fullName') });
      }
    }
  });
});
define('ember-inspector/controllers/container-types', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Controller = _ember.default.Controller,
      sort = _ember.default.computed.sort;
  exports.default = Controller.extend({
    sortProperties: ['name'],
    sorted: sort('model', 'sortProperties')
  });
});
define("ember-inspector/controllers/deprecations", ["exports", "ember", "ember-inspector/computed/debounce", "ember-inspector/utils/search-match"], function (exports, _ember, _debounce, _searchMatch) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Controller = _ember.default.Controller,
      computed = _ember.default.computed,
      get = _ember.default.get,
      controller = _ember.default.inject.controller;
  var filter = computed.filter;
  exports.default = Controller.extend({
    /**
     * Used by the view for content height calculation
     *
     * @property application
     * @type {Controller}
     */
    application: controller(),
    search: null,
    searchVal: (0, _debounce.default)('search', 300),
    filtered: filter('model', function (item) {
      return (0, _searchMatch.default)(get(item, 'message'), this.get('search'));
    }).property('model.@each.message', 'search'),
    actions: {
      openResource: function openResource(item) {
        this.get('adapter').openResource(item.fullSource, item.line);
      },
      traceSource: function traceSource(deprecation, source) {
        this.get('port').send('deprecation:sendStackTraces', {
          deprecation: {
            message: deprecation.message,
            sources: [source]
          }
        });
      },
      traceDeprecations: function traceDeprecations(deprecation) {
        this.get('port').send('deprecation:sendStackTraces', {
          deprecation: deprecation
        });
      }
    }
  });
});
define('ember-inspector/controllers/info', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Controller = _ember.default.Controller,
      controller = _ember.default.inject.controller;
  exports.default = Controller.extend({
    application: controller()
  });
});
define('ember-inspector/controllers/model-types', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Controller = _ember.default.Controller,
      computed = _ember.default.computed,
      get = _ember.default.get,
      inject = _ember.default.inject;
  var sort = computed.sort;
  var controller = inject.controller;
  exports.default = Controller.extend({
    application: controller(),
    navWidth: 180,
    sortProperties: ['name'],
    options: {
      hideEmptyModelTypes: false
    },

    sorted: sort('filtered', 'sortProperties'),

    filtered: computed('model.@each.count', 'options.hideEmptyModelTypes', function () {
      var _this = this;

      return this.get('model').filter(function (item) {
        var hideEmptyModels = get(_this, 'options.hideEmptyModelTypes');

        if (hideEmptyModels) {
          return !!get(item, 'count');
        } else {
          return true;
        }
      });
    })
  });
});
define('ember-inspector/controllers/promise-tree', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Controller = _ember.default.Controller,
      computed = _ember.default.computed,
      observer = _ember.default.observer,
      run = _ember.default.run,
      controller = _ember.default.inject.controller,
      isEmpty = _ember.default.isEmpty;
  var equal = computed.equal,
      bool = computed.bool,
      and = computed.and,
      not = computed.not,
      filter = computed.filter;
  var next = run.next,
      once = run.once,
      debounce = run.debounce;
  exports.default = Controller.extend({
    application: controller(),

    queryParams: ['filter'],

    createdAfter: null,

    // below used to show the "refresh" message
    isEmpty: equal('model.length', 0),
    wasCleared: bool('createdAfter'),
    neverCleared: not('wasCleared'),
    shouldRefresh: and('isEmpty', 'neverCleared'),

    // Keep track of promise stack traces.
    // It is opt-in due to performance reasons.
    instrumentWithStack: false,

    /* jscs:disable validateIndentation */
    filtered: filter('model.@each.{createdAt,fulfilledBranch,rejectedBranch,pendingBranch,isVisible}', function (item) {

      // exclude cleared promises
      if (this.get('createdAfter') && item.get('createdAt') < this.get('createdAfter')) {
        return false;
      }

      if (!item.get('isVisible')) {
        return false;
      }

      // Exclude non-filter complying promises
      // If at least one of their children passes the filter,
      // then they pass
      var include = true;
      if (this.get('filter') === 'pending') {
        include = item.get('pendingBranch');
      } else if (this.get('filter') === 'rejected') {
        include = item.get('rejectedBranch');
      } else if (this.get('filter') === 'fulfilled') {
        include = item.get('fulfilledBranch');
      }
      if (!include) {
        return false;
      }

      // Search filter
      // If they or at least one of their children
      // match the search, then include them
      var search = this.get('effectiveSearch');
      if (!isEmpty(search)) {
        return item.matches(search);
      }
      return true;
    }),
    /* jscs:enable validateIndentation */

    filter: 'all',

    noFilter: equal('filter', 'all'),
    isRejectedFilter: equal('filter', 'rejected'),
    isPendingFilter: equal('filter', 'pending'),
    isFulfilledFilter: equal('filter', 'fulfilled'),

    search: null,
    effectiveSearch: null,

    searchChanged: observer('search', function () {
      debounce(this, this.notifyChange, 500);
    }),

    notifyChange: function notifyChange() {
      var _this = this;

      this.set('effectiveSearch', this.get('search'));
      next(function () {
        _this.notifyPropertyChange('model');
      });
    },


    actions: {
      setFilter: function setFilter(filter) {
        var _this2 = this;

        this.set('filter', filter);
        next(function () {
          _this2.notifyPropertyChange('filtered');
        });
      },
      clear: function clear() {
        this.set('createdAfter', new Date());
        once(this, this.notifyChange);
      },
      tracePromise: function tracePromise(promise) {
        this.get('port').send('promise:tracePromise', { promiseId: promise.get('guid') });
      },
      updateInstrumentWithStack: function updateInstrumentWithStack(bool) {
        this.port.send('promise:setInstrumentWithStack', { instrumentWithStack: bool });
      },
      toggleExpand: function toggleExpand(promise) {
        var isExpanded = !promise.get('isExpanded');
        promise.set('isManuallyExpanded', isExpanded);
        promise.recalculateExpanded();
        var children = promise._allChildren();
        if (isExpanded) {
          children.forEach(function (child) {
            var isManuallyExpanded = child.get('isManuallyExpanded');
            if (isManuallyExpanded === undefined) {
              child.set('isManuallyExpanded', isExpanded);
              child.recalculateExpanded();
            }
          });
        }
      },
      inspectObject: function inspectObject() {
        var _get;

        (_get = this.get('target')).send.apply(_get, ['inspectObject'].concat(Array.prototype.slice.call(arguments)));
      },
      sendValueToConsole: function sendValueToConsole(promise) {
        this.get('port').send('promise:sendValueToConsole', { promiseId: promise.get('guid') });
      }
    }
  });
});
define("ember-inspector/controllers/records", ["exports", "ember", "ember-inspector/utils/escape-reg-exp"], function (exports, _ember, _escapeRegExp) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Controller = _ember.default.Controller,
      computed = _ember.default.computed,
      observer = _ember.default.observer,
      controller = _ember.default.inject.controller,
      String = _ember.default.String;
  var none = computed.none,
      readOnly = computed.readOnly;
  var dasherize = String.dasherize;

  var get = _ember.default.get;

  exports.default = Controller.extend({
    application: controller(),

    queryParams: ['filterValue', 'search'],

    columns: readOnly('modelType.columns'),

    search: '',

    filters: computed(function () {
      return [];
    }),

    filterValue: null,

    noFilterValue: none('filterValue'),

    modelChanged: observer('model', function () {
      this.set('search', '');
    }),

    recordToString: function recordToString(record) {
      var search = '';
      var searchKeywords = get(record, 'searchKeywords');
      if (searchKeywords) {
        search = get(record, 'searchKeywords').join(' ');
      }
      return search.toLowerCase();
    },


    /**
     * The number of columns to show by default. Since a specific's model's
     * column count is unknown, we only show the first 5 by default.
     * The visibility can be modified on the list level itself.
     *
     * @property columnLimit
     * @type {Number}
     * @default 5
     */
    columnLimit: 5,

    /**
     * The lists's schema containing info about the list's columns.
     * This is usually a static object except in this case each model
     * type has different columns so we need to build it dynamically.
     *
     * The format is:
     * ```js
     * {
     *   columns: [{
     *     id: 'title',
     *     name: 'Title',
     *     visible: true
     *   }]
     * }
     * ```
     *
     * @property schema
     * @type {Object}
     */
    schema: computed('columns', function () {
      var _this = this;

      var columns = this.get('columns').map(function (_ref, index) {
        var desc = _ref.desc;
        return {
          id: dasherize(desc),
          name: desc,
          visible: index < _this.get('columnLimit')
        };
      });
      return { columns: columns };
    }),

    filtered: computed('search', 'model.@each.columnValues', 'model.@each.filterValues', 'filterValue', function () {
      var _this2 = this;

      var search = this.get('search');
      var filter = this.get('filterValue');
      return this.get('model').filter(function (item) {
        // check filters
        if (filter && !get(item, "filterValues." + filter)) {
          return false;
        }

        // check search
        if (!_ember.default.isEmpty(search)) {
          var searchString = _this2.recordToString(item);
          return !!searchString.match(new RegExp(".*" + (0, _escapeRegExp.default)(search.toLowerCase()) + ".*"));
        }
        return true;
      });
    }),

    actions: {
      /**
       * Called whenever the filter is updated.
       *
       * @method setFilter
       * @param {String} val
       */
      setFilter: function setFilter(val) {
        val = val || null;
        this.set('filterValue', val);
      },


      /**
       * Inspect a specific record. Called when a row
       * is clicked.
       *
       * @method inspectModel
       * @property {Object}
       */
      inspectModel: function inspectModel(model) {
        this.get('port').send('data:inspectModel', { objectId: _ember.default.get(model, 'objectId') });
      }
    }
  });
});
define("ember-inspector/controllers/render-tree", ["exports", "ember", "ember-inspector/utils/escape-reg-exp", "ember-inspector/computed/debounce", "ember-inspector/services/storage/local"], function (exports, _ember, _escapeRegExp, _debounce, _local) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var computed = _ember.default.computed,
      isEmpty = _ember.default.isEmpty,
      Controller = _ember.default.Controller,
      _Ember$inject = _ember.default.inject,
      controller = _Ember$inject.controller,
      service = _Ember$inject.service;
  var and = computed.and,
      equal = computed.equal,
      filter = computed.filter;

  var get = _ember.default.get;

  exports.default = Controller.extend({
    application: controller(),
    initialEmpty: false,
    modelEmpty: equal('model.length', 0),
    showEmpty: and('initialEmpty', 'modelEmpty'),

    /**
     * Service used for storage. Storage is
     * needed for remembering if the user closed the warning
     * as it might get mildly annoying for devs to see and close
     * the trivial warning every time.
     * The default storage service is local storage however we
     * fall back to memory storage if local storage is disabled (For
     * example as a security setting in Chrome).
     *
     * @property storage
     * @type {Service}
     */
    storage: service("storage/" + (_local.default.SUPPORTED ? 'local' : 'memory')),

    /**
     * Checks if the user previously closed the warning by referencing localStorage
     * it is a computed get/set property.
     *
     * @property isWarningClosed
     * @type {Boolean}
     */
    isWarningClosed: computed({
      get: function get() {
        return !!this.get('storage').getItem('is-render-tree-warning-closed');
      },
      set: function set(key, value) {
        this.get('storage').setItem('is-render-tree-warning-closed', value);
        return value;
      }
    }),

    /**
     * Indicate the table's header's height in pixels.
     *
     * @property headerHeight
     * @type {Number}
     */
    headerHeight: computed('isWarningClosed', function () {
      return this.get('isWarningClosed') ? 31 : 56;
    }),

    actions: {
      /**
       * This action when triggered, closes the warning message for rendering times being inaccurate
       * and sets `isWarningClosed` value to true, thus preventing the warning from being shown further.
       *
       * @method closeWarning
       */
      closeWarning: function closeWarning() {
        this.set('isWarningClosed', true);
      }
    },

    // bound to the input field, updates the `search` property
    // 300ms after changing
    searchField: (0, _debounce.default)('search', 300),

    // model filtered based on this value
    search: '',

    escapedSearch: computed('search', function () {
      return (0, _escapeRegExp.default)(this.get('search').toLowerCase());
    }),

    filtered: filter('model', function (item) {
      var search = this.get('escapedSearch');
      if (isEmpty(search)) {
        return true;
      }
      var regExp = new RegExp(search);
      return !!recursiveMatch(item, regExp);
    }).property('model.@each.name', 'search')
  });


  function recursiveMatch(item, regExp) {
    var children = void 0,
        child = void 0;
    var name = get(item, 'name');
    if (name.toLowerCase().match(regExp)) {
      return true;
    }
    children = get(item, 'children');
    for (var i = 0; i < children.length; i++) {
      child = children[i];
      if (recursiveMatch(child, regExp)) {
        return true;
      }
    }
    return false;
  }
});
define("ember-inspector/controllers/route-tree", ["exports", "ember", "ember-inspector/utils/check-current-route"], function (exports, _ember, _checkCurrentRoute) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Controller = _ember.default.Controller,
      computed = _ember.default.computed,
      controller = _ember.default.inject.controller;
  exports.default = Controller.extend({
    application: controller(),

    queryParams: ['hideRoutes'],

    currentRoute: null,
    hideRoutes: computed.alias('options.hideRoutes'),

    options: {
      hideRoutes: false
    },

    model: computed(function () {
      return [];
    }),

    filtered: computed('model.[]', 'options.hideRoutes', 'currentRoute', function () {
      var _this = this;

      return this.get('model').filter(function (routeItem) {
        var currentRoute = _this.get('currentRoute');
        var hideRoutes = _this.get('options.hideRoutes');

        if (hideRoutes && currentRoute) {
          return (0, _checkCurrentRoute.default)(currentRoute, routeItem.value.name);
        } else {
          return true;
        }
      });
    }),

    actions: {
      inspectRoute: function inspectRoute(name) {
        this.get('port').send('objectInspector:inspectRoute', { name: name });
      },
      sendRouteHandlerToConsole: function sendRouteHandlerToConsole(name) {
        this.get('port').send('objectInspector:sendRouteHandlerToConsole', { name: name });
      },
      inspectController: function inspectController(controller) {
        if (!controller.exists) {
          return;
        }
        this.get('port').send('objectInspector:inspectController', { name: controller.name });
      },
      sendControllerToConsole: function sendControllerToConsole(name) {
        this.get('port').send('objectInspector:sendControllerToConsole', { name: name });
      }
    }
  });
});
define('ember-inspector/controllers/view-tree', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var computed = _ember.default.computed,
      Controller = _ember.default.Controller,
      on = _ember.default.on,
      observer = _ember.default.observer,
      controller = _ember.default.inject.controller;
  var alias = computed.alias;
  exports.default = Controller.extend({
    application: controller(),
    pinnedObjectId: null,
    inspectingViews: false,
    queryParams: ['components'],
    components: alias('options.components'),
    options: {
      components: false
    },

    optionsChanged: on('init', observer('options.components', function () {
      this.port.send('view:setOptions', { options: this.get('options') });
    })),

    actions: {
      previewLayer: function previewLayer(_ref) {
        var _ref$value = _ref.value,
            objectId = _ref$value.objectId,
            elementId = _ref$value.elementId,
            renderNodeId = _ref$value.renderNodeId;

        // We are passing all of objectId, elementId, and renderNodeId to support post-glimmer 1, post-glimmer 2, and root for
        // post-glimmer 2
        this.get('port').send('view:previewLayer', { objectId: objectId, renderNodeId: renderNodeId, elementId: elementId });
      },
      hidePreview: function hidePreview() {
        this.get('port').send('view:hidePreview');
      },
      toggleViewInspection: function toggleViewInspection() {
        this.get('port').send('view:inspectViews', { inspect: !this.get('inspectingViews') });
      },
      sendModelToConsole: function sendModelToConsole(value) {
        // do not use `sendObjectToConsole` because models don't have to be ember objects
        this.get('port').send('view:sendModelToConsole', value);
      },
      sendObjectToConsole: function sendObjectToConsole(objectId) {
        this.get('port').send('objectInspector:sendToConsole', { objectId: objectId });
      },
      inspect: function inspect(objectId) {
        if (objectId) {
          this.get('port').send('objectInspector:inspectById', { objectId: objectId });
        }
      },
      inspectElement: function inspectElement(_ref2) {
        var objectId = _ref2.objectId,
            elementId = _ref2.elementId;

        this.get('port').send('view:inspectElement', { objectId: objectId, elementId: elementId });
      }
    }
  });
});
define('ember-inspector/helpers/and', ['exports', 'ember', 'ember-truth-helpers/helpers/and'], function (exports, _ember, _and) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var forExport = null;

  if (_ember.default.Helper) {
    forExport = _ember.default.Helper.helper(_and.andHelper);
  } else if (_ember.default.HTMLBars.makeBoundHelper) {
    forExport = _ember.default.HTMLBars.makeBoundHelper(_and.andHelper);
  }

  exports.default = forExport;
});
define('ember-inspector/helpers/app-version', ['exports', 'ember', 'ember-inspector/config/environment', 'ember-cli-app-version/utils/regexp'], function (exports, _ember, _environment, _regexp) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.appVersion = appVersion;
  var version = _environment.default.APP.version;
  function appVersion(_) {
    var hash = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (hash.hideSha) {
      return version.match(_regexp.versionRegExp)[0];
    }

    if (hash.hideVersion) {
      return version.match(_regexp.shaRegExp)[0];
    }

    return version;
  }

  exports.default = _ember.default.Helper.helper(appVersion);
});
define('ember-inspector/helpers/build-style', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.buildStyle = buildStyle;
  var helper = _ember.default.Helper.helper,
      htmlSafe = _ember.default.String.htmlSafe;
  var keys = Object.keys;
  function buildStyle(_, options) {
    return htmlSafe(keys(options).reduce(function (style, key) {
      return '' + style + key + ':' + options[key] + ';';
    }, ''));
  }

  exports.default = helper(buildStyle);
});
define('ember-inspector/helpers/cancel-all', ['exports', 'ember', 'ember-concurrency/-helpers'], function (exports, _ember, _helpers) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.cancelHelper = cancelHelper;
  function cancelHelper(args) {
    var cancelable = args[0];
    if (!cancelable || typeof cancelable.cancelAll !== 'function') {
      _ember.default.assert('The first argument passed to the `cancel-all` helper should be a Task or TaskGroup (without quotes); you passed ' + cancelable, false);
    }

    return (0, _helpers.taskHelperClosure)('cancelAll', args);
  }

  exports.default = _ember.default.Helper.helper(cancelHelper);
});
define('ember-inspector/helpers/eq', ['exports', 'ember', 'ember-truth-helpers/helpers/equal'], function (exports, _ember, _equal) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var forExport = null;

  if (_ember.default.Helper) {
    forExport = _ember.default.Helper.helper(_equal.equalHelper);
  } else if (_ember.default.HTMLBars.makeBoundHelper) {
    forExport = _ember.default.HTMLBars.makeBoundHelper(_equal.equalHelper);
  }

  exports.default = forExport;
});
define('ember-inspector/helpers/escape-url', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.escapeUrl = escapeUrl;
  var helper = _ember.default.Helper.helper;

  /**
   * Escape a url component
   *
   * @method escapeUrl
   * @param {String} url
   * @return {String} encoded url
   */
  function escapeUrl(url) {
    return encodeURIComponent(url);
  }

  exports.default = helper(escapeUrl);
});
define('ember-inspector/helpers/gt', ['exports', 'ember', 'ember-truth-helpers/helpers/gt'], function (exports, _ember, _gt) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var forExport = null;

  if (_ember.default.Helper) {
    forExport = _ember.default.Helper.helper(_gt.gtHelper);
  } else if (_ember.default.HTMLBars.makeBoundHelper) {
    forExport = _ember.default.HTMLBars.makeBoundHelper(_gt.gtHelper);
  }

  exports.default = forExport;
});
define('ember-inspector/helpers/gte', ['exports', 'ember', 'ember-truth-helpers/helpers/gte'], function (exports, _ember, _gte) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var forExport = null;

  if (_ember.default.Helper) {
    forExport = _ember.default.Helper.helper(_gte.gteHelper);
  } else if (_ember.default.HTMLBars.makeBoundHelper) {
    forExport = _ember.default.HTMLBars.makeBoundHelper(_gte.gteHelper);
  }

  exports.default = forExport;
});
define('ember-inspector/helpers/is-array', ['exports', 'ember', 'ember-truth-helpers/helpers/is-array'], function (exports, _ember, _isArray) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var forExport = null;

  if (_ember.default.Helper) {
    forExport = _ember.default.Helper.helper(_isArray.isArrayHelper);
  } else if (_ember.default.HTMLBars.makeBoundHelper) {
    forExport = _ember.default.HTMLBars.makeBoundHelper(_isArray.isArrayHelper);
  }

  exports.default = forExport;
});
define('ember-inspector/helpers/is-equal', ['exports', 'ember-truth-helpers/helpers/is-equal'], function (exports, _isEqual) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function () {
      return _isEqual.default;
    }
  });
  Object.defineProperty(exports, 'isEqual', {
    enumerable: true,
    get: function () {
      return _isEqual.isEqual;
    }
  });
});
define('ember-inspector/helpers/lt', ['exports', 'ember', 'ember-truth-helpers/helpers/lt'], function (exports, _ember, _lt) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var forExport = null;

  if (_ember.default.Helper) {
    forExport = _ember.default.Helper.helper(_lt.ltHelper);
  } else if (_ember.default.HTMLBars.makeBoundHelper) {
    forExport = _ember.default.HTMLBars.makeBoundHelper(_lt.ltHelper);
  }

  exports.default = forExport;
});
define('ember-inspector/helpers/lte', ['exports', 'ember', 'ember-truth-helpers/helpers/lte'], function (exports, _ember, _lte) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var forExport = null;

  if (_ember.default.Helper) {
    forExport = _ember.default.Helper.helper(_lte.lteHelper);
  } else if (_ember.default.HTMLBars.makeBoundHelper) {
    forExport = _ember.default.HTMLBars.makeBoundHelper(_lte.lteHelper);
  }

  exports.default = forExport;
});
define('ember-inspector/helpers/ms-to-time', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.msToTime = msToTime;

  var _slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

  var helper = _ember.default.Helper.helper;
  function msToTime(_ref) {
    var _ref2 = _slicedToArray(_ref, 1),
        time = _ref2[0];

    if (time && !isNaN(+time)) {
      var formatted = time.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
      return formatted + 'ms';
    }
  }

  exports.default = helper(msToTime);
});
define('ember-inspector/helpers/not-eq', ['exports', 'ember', 'ember-truth-helpers/helpers/not-equal'], function (exports, _ember, _notEqual) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var forExport = null;

  if (_ember.default.Helper) {
    forExport = _ember.default.Helper.helper(_notEqual.notEqualHelper);
  } else if (_ember.default.HTMLBars.makeBoundHelper) {
    forExport = _ember.default.HTMLBars.makeBoundHelper(_notEqual.notEqualHelper);
  }

  exports.default = forExport;
});
define('ember-inspector/helpers/not', ['exports', 'ember', 'ember-truth-helpers/helpers/not'], function (exports, _ember, _not) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var forExport = null;

  if (_ember.default.Helper) {
    forExport = _ember.default.Helper.helper(_not.notHelper);
  } else if (_ember.default.HTMLBars.makeBoundHelper) {
    forExport = _ember.default.HTMLBars.makeBoundHelper(_not.notHelper);
  }

  exports.default = forExport;
});
define('ember-inspector/helpers/one-way', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.oneWay = oneWay;

  var _slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

  var helper = _ember.default.Helper.helper;
  function oneWay(_ref) {
    var _ref2 = _slicedToArray(_ref, 1),
        val = _ref2[0];

    return val;
  }

  exports.default = helper(oneWay);
});
define('ember-inspector/helpers/or', ['exports', 'ember', 'ember-truth-helpers/helpers/or'], function (exports, _ember, _or) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var forExport = null;

  if (_ember.default.Helper) {
    forExport = _ember.default.Helper.helper(_or.orHelper);
  } else if (_ember.default.HTMLBars.makeBoundHelper) {
    forExport = _ember.default.HTMLBars.makeBoundHelper(_or.orHelper);
  }

  exports.default = forExport;
});
define('ember-inspector/helpers/perform', ['exports', 'ember', 'ember-concurrency/-task-property', 'ember-concurrency/-helpers'], function (exports, _ember, _taskProperty, _helpers) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.performHelper = performHelper;
  function performHelper(args, hash) {
    var task = args[0];
    if (!(task instanceof _taskProperty.Task)) {
      _ember.default.assert('The first argument passed to the `perform` helper should be a Task object (without quotes); you passed ' + task, false);
    }

    return (0, _helpers.taskHelperClosure)('perform', args, hash);
  }

  exports.default = _ember.default.Helper.helper(performHelper);
});
define('ember-inspector/helpers/schema-for', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

  var Helper = _ember.default.Helper,
      getOwner = _ember.default.getOwner;
  exports.default = Helper.extend({
    compute: function compute(_ref) {
      var _ref2 = _slicedToArray(_ref, 1),
          name = _ref2[0];

      return getOwner(this).resolveRegistration('schema:' + name);
    }
  });
});
define('ember-inspector/helpers/task', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
        arr2[i] = arr[i];
      }

      return arr2;
    } else {
      return Array.from(arr);
    }
  }

  function _toArray(arr) {
    return Array.isArray(arr) ? arr : Array.from(arr);
  }

  function taskHelper(_ref) {
    var _ref2 = _toArray(_ref),
        task = _ref2[0],
        args = _ref2.slice(1);

    return task._curry.apply(task, _toConsumableArray(args));
  }

  exports.default = _ember.default.Helper.helper(taskHelper);
});
define('ember-inspector/helpers/xor', ['exports', 'ember', 'ember-truth-helpers/helpers/xor'], function (exports, _ember, _xor) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var forExport = null;

  if (_ember.default.Helper) {
    forExport = _ember.default.Helper.helper(_xor.xorHelper);
  } else if (_ember.default.HTMLBars.makeBoundHelper) {
    forExport = _ember.default.HTMLBars.makeBoundHelper(_xor.xorHelper);
  }

  exports.default = forExport;
});
define('ember-inspector/initializers/app-version', ['exports', 'ember-cli-app-version/initializer-factory', 'ember-inspector/config/environment'], function (exports, _initializerFactory, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var _config$APP = _environment.default.APP,
      name = _config$APP.name,
      version = _config$APP.version;
  exports.default = {
    name: 'App Version',
    initialize: (0, _initializerFactory.default)(name, version)
  };
});
define('ember-inspector/initializers/container-debug-adapter', ['exports', 'ember-resolver/resolvers/classic/container-debug-adapter'], function (exports, _containerDebugAdapter) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'container-debug-adapter',

    initialize: function initialize() {
      var app = arguments[1] || arguments[0];

      app.register('container-debug-adapter:main', _containerDebugAdapter.default);
      app.inject('container-debug-adapter:main', 'namespace', 'application:main');
    }
  };
});
define('ember-inspector/initializers/ember-concurrency', ['exports', 'ember-concurrency'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    name: 'ember-concurrency',
    initialize: function initialize() {}
  };
});
define('ember-inspector/initializers/export-application-global', ['exports', 'ember', 'ember-inspector/config/environment'], function (exports, _ember, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = initialize;
  function initialize() {
    var application = arguments[1] || arguments[0];
    if (_environment.default.exportApplicationGlobal !== false) {
      var theGlobal;
      if (typeof window !== 'undefined') {
        theGlobal = window;
      } else if (typeof global !== 'undefined') {
        theGlobal = global;
      } else if (typeof self !== 'undefined') {
        theGlobal = self;
      } else {
        // no reasonable global, just bail
        return;
      }

      var value = _environment.default.exportApplicationGlobal;
      var globalName;

      if (typeof value === 'string') {
        globalName = value;
      } else {
        globalName = _ember.default.String.classify(_environment.default.modulePrefix);
      }

      if (!theGlobal[globalName]) {
        theGlobal[globalName] = application;

        application.reopen({
          willDestroy: function willDestroy() {
            this._super.apply(this, arguments);
            delete theGlobal[globalName];
          }
        });
      }
    }
  }

  exports.default = {
    name: 'export-application-global',

    initialize: initialize
  };
});
define('ember-inspector/initializers/truth-helpers', ['exports', 'ember', 'ember-truth-helpers/utils/register-helper', 'ember-truth-helpers/helpers/and', 'ember-truth-helpers/helpers/or', 'ember-truth-helpers/helpers/equal', 'ember-truth-helpers/helpers/not', 'ember-truth-helpers/helpers/is-array', 'ember-truth-helpers/helpers/not-equal', 'ember-truth-helpers/helpers/gt', 'ember-truth-helpers/helpers/gte', 'ember-truth-helpers/helpers/lt', 'ember-truth-helpers/helpers/lte'], function (exports, _ember, _registerHelper, _and, _or, _equal, _not, _isArray, _notEqual, _gt, _gte, _lt, _lte) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initialize = initialize;
  function initialize() /* container, application */{

    // Do not register helpers from Ember 1.13 onwards, starting from 1.13 they
    // will be auto-discovered.
    if (_ember.default.Helper) {
      return;
    }

    (0, _registerHelper.registerHelper)('and', _and.andHelper);
    (0, _registerHelper.registerHelper)('or', _or.orHelper);
    (0, _registerHelper.registerHelper)('eq', _equal.equalHelper);
    (0, _registerHelper.registerHelper)('not', _not.notHelper);
    (0, _registerHelper.registerHelper)('is-array', _isArray.isArrayHelper);
    (0, _registerHelper.registerHelper)('not-eq', _notEqual.notEqualHelper);
    (0, _registerHelper.registerHelper)('gt', _gt.gtHelper);
    (0, _registerHelper.registerHelper)('gte', _gte.gteHelper);
    (0, _registerHelper.registerHelper)('lt', _lt.ltHelper);
    (0, _registerHelper.registerHelper)('lte', _lte.lteHelper);
  }

  exports.default = {
    name: 'truth-helpers',
    initialize: initialize
  };
});
define("ember-inspector/libs/promise-assembler", ["exports", "ember", "ember-inspector/models/promise"], function (exports, _ember, _promise) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var EventedMixin = _ember.default.Evented;

  var arrayComputed = _ember.default.computed(function () {
    return [];
  });

  var objectComputed = _ember.default.computed(function () {
    return {};
  });

  exports.default = _ember.default.Object.extend(EventedMixin, {
    all: arrayComputed,
    topSort: arrayComputed,
    topSortMeta: objectComputed,
    promiseIndex: objectComputed,

    // Used to track whether current message received
    // is the first in the request
    // Mainly helps in triggering 'firstMessageReceived' event
    firstMessageReceived: false,

    start: function start() {
      this.get('port').on('promise:promisesUpdated', this, this.addOrUpdatePromises);
      this.get('port').send('promise:getAndObservePromises');
    },
    stop: function stop() {
      this.get('port').off('promise:promisesUpdated', this, this.addOrUpdatePromises);
      this.get('port').send('promise:releasePromises');
      this.reset();
    },
    reset: function reset() {
      this.set('topSortMeta', {});
      this.set('promiseIndex', {});
      this.get('topSort').clear();

      this.set('firstMessageReceived', false);
      var all = this.get('all');
      // Lazily destroy promises
      // Allows for a smooth transition on deactivate,
      // and thus providing the illusion of better perf
      _ember.default.run.later(this, function () {
        this.destroyPromises(all);
      }, 500);
      this.set('all', []);
    },
    destroyPromises: function destroyPromises(promises) {
      promises.forEach(function (item) {
        item.destroy();
      });
    },
    addOrUpdatePromises: function addOrUpdatePromises(message) {
      this.rebuildPromises(message.promises);

      if (!this.get('firstMessageReceived')) {
        this.set('firstMessageReceived', true);
        this.trigger('firstMessageReceived');
      }
    },
    rebuildPromises: function rebuildPromises(promises) {
      var _this = this;

      promises.forEach(function (props) {
        props = _ember.default.copy(props);
        var childrenIds = props.children;
        var parentId = props.parent;
        delete props.children;
        delete props.parent;
        if (parentId && parentId !== props.guid) {
          props.parent = _this.updateOrCreate({ guid: parentId });
        }
        var promise = _this.updateOrCreate(props);
        if (childrenIds) {
          childrenIds.forEach(function (childId) {
            // avoid infinite recursion
            if (childId === props.guid) {
              return;
            }
            var child = _this.updateOrCreate({ guid: childId, parent: promise });
            promise.get('children').pushObject(child);
          });
        }
      });
    },
    updateTopSort: function updateTopSort(promise) {
      var topSortMeta = this.get('topSortMeta');
      var guid = promise.get('guid');
      var meta = topSortMeta[guid];
      var isNew = !meta;
      var hadParent = false;
      var hasParent = !!promise.get('parent');
      var topSort = this.get('topSort');
      var parentChanged = isNew;

      if (isNew) {
        meta = topSortMeta[guid] = {};
      } else {
        hadParent = meta.hasParent;
      }
      if (!isNew && hasParent !== hadParent) {
        // todo: implement recursion to reposition children
        topSort.removeObject(promise);
        parentChanged = true;
      }
      meta.hasParent = hasParent;
      if (parentChanged) {
        this.insertInTopSort(promise);
      }
    },
    insertInTopSort: function insertInTopSort(promise) {
      var _this2 = this;

      var topSort = this.get('topSort');
      if (promise.get('parent')) {
        var parentIndex = topSort.indexOf(promise.get('parent'));
        topSort.insertAt(parentIndex + 1, promise);
      } else {
        topSort.pushObject(promise);
      }
      promise.get('children').forEach(function (child) {
        topSort.removeObject(child);
        _this2.insertInTopSort(child);
      });
    },
    updateOrCreate: function updateOrCreate(props) {
      var guid = props.guid;
      var promise = this.findOrCreate(guid);

      promise.setProperties(props);

      this.updateTopSort(promise);

      return promise;
    },
    createPromise: function createPromise(props) {
      var promise = _promise.default.create(props);
      var index = this.get('all.length');

      this.get('all').pushObject(promise);
      this.get('promiseIndex')[promise.get('guid')] = index;
      return promise;
    },
    find: function find(guid) {
      if (guid) {
        var index = this.get('promiseIndex')[guid];
        if (index !== undefined) {
          return this.get('all').objectAt(index);
        }
      } else {
        return this.get('all');
      }
    },
    findOrCreate: function findOrCreate(guid) {
      if (!guid) {
        _ember.default.assert('You have tried to findOrCreate without a guid');
      }
      return this.find(guid) || this.createPromise({ guid: guid });
    }
  });
});
define('ember-inspector/libs/resizable-columns', ['exports', 'ember', 'ember-inspector/utils/compare-arrays'], function (exports, _ember, _compareArrays) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var set = _ember.default.set,
      isNone = _ember.default.isNone,
      copy = _ember.default.copy,
      merge = _ember.default.merge;
  var floor = Math.floor;
  var keys = Object.keys;

  var THIRTY_DAYS_FROM_NOW = 1000 * 60 * 60 * 24 * 30;

  var _class = function () {

    /**
     * Set up everything when new instance is created.
     *
     * @method constructor
     * @param {Object}
     *  - {String} key Used as key for local storage caching
     *  - {Number} tableWidth The table's width used for width calculations
     *  - {Number} minWidth The minimum width a column can reach
     *  - {Service} storage The local storage service that manages caching
     *  - {Array} columnSchema Contains the list of columns. Each column object should contain:
     *    - {String} id The column's unique identifier
     *    - {String} name The column's name
     *    - {Boolean} visible The column's default visibility
     */
    function _class(_ref) {
      var key = _ref.key,
          _ref$tableWidth = _ref.tableWidth,
          tableWidth = _ref$tableWidth === undefined ? 0 : _ref$tableWidth,
          _ref$minWidth = _ref.minWidth,
          minWidth = _ref$minWidth === undefined ? 10 : _ref$minWidth,
          storage = _ref.storage,
          columnSchema = _ref.columnSchema;

      _classCallCheck(this, _class);

      this.tableWidth = tableWidth;
      this.minWidth = minWidth;
      this.key = key;
      this.storage = storage;
      this.columnSchema = columnSchema;
      this.setupCache();
    }

    /**
     * This method is called on initialization before everything.
     *
     * Does 3 things:
     *   - Clears the cache if it's invalid.
     *   - Clears expired cache.
     *   - Sets the current cache timestamp to now.
     *
     * @method setupCache
     */


    _createClass(_class, [{
      key: 'setupCache',
      value: function setupCache() {
        this.clearInvalidCache();
        this.clearExpiredCache();
        this.setCacheTimestamp();
      }
    }, {
      key: 'setCacheTimestamp',
      value: function setCacheTimestamp() {
        var saved = this.storage.getItem(this.getStorageKey()) || {};
        saved.updatedAt = Date.now();
        this.storage.setItem(this.getStorageKey(), saved);
      }
    }, {
      key: 'clearInvalidCache',
      value: function clearInvalidCache() {
        var saved = this.storage.getItem(this.getStorageKey());
        if (saved && saved.columnVisibility) {
          var savedIds = keys(saved.columnVisibility).sort();
          var schemaIds = this.columnSchema.mapBy('id').sort();
          if (!(0, _compareArrays.default)(savedIds, schemaIds)) {
            // Clear saved items
            this.storage.removeItem(this.getStorageKey());
          }
        }
      }
    }, {
      key: 'clearExpiredCache',
      value: function clearExpiredCache() {
        var _this = this;

        var now = Date.now();
        this.storage.keys().filter(function (key) {
          return key.match(/^x-list/);
        }).forEach(function (key) {
          if (now - _this.storage.getItem(key).updatedAt > THIRTY_DAYS_FROM_NOW) {
            _this.storage.removeItem(key);
          }
        });
      }
    }, {
      key: 'getColumnWidth',
      value: function getColumnWidth(id) {
        var total = this.tableWidth;
        var percentage = this.getSavedPercentage(id);
        if (isNone(percentage)) {
          percentage = 1 / this.columnSchema.length;
        }
        return floor(total * percentage);
      }
    }, {
      key: 'setTableWidth',
      value: function setTableWidth(tableWidth) {
        this.tableWidth = tableWidth;
        this.build();
      }
    }, {
      key: 'build',
      value: function build() {
        this.buildColumns();
        this.processColumns();
      }
    }, {
      key: 'isColumnVisible',
      value: function isColumnVisible(id) {
        var saved = this.storage.getItem(this.getStorageKey()) || {};
        if (saved.columnVisibility && !isNone(saved.columnVisibility[id])) {
          return saved.columnVisibility[id];
        }
        return this.columnSchema.findBy('id', id).visible;
      }
    }, {
      key: 'getColumnVisibility',
      value: function getColumnVisibility() {
        return this._columnVisibility;
      }
    }, {
      key: 'buildColumnVisibility',
      value: function buildColumnVisibility() {
        var _this2 = this;

        if (this._columnVisibility) {
          return this._columnVisibility;
        }
        this._columnVisibility = this.columnSchema.map(function (column) {
          return merge(copy(column), {
            visible: _this2.isColumnVisible(column.id)
          });
        });
      }
    }, {
      key: 'buildColumns',
      value: function buildColumns() {
        var _this3 = this;

        this.buildColumnVisibility();
        var totalWidth = 0;
        var columns = this._columnVisibility.filterBy('visible').map(function (_ref2) {
          var id = _ref2.id,
              name = _ref2.name;

          var width = _this3.getColumnWidth(id);
          totalWidth += width;
          return { width: width, id: id, name: name };
        });
        // Fix percentage precision errors. If we only add it to the last column
        // the last column will slowly increase in size every time we visit this list.
        // So we distribute the extra pixels starting with the smallest column.
        if (columns.length > 0) {
          (function () {
            var diff = _this3.tableWidth - totalWidth;
            while (diff > 0) {
              columns.sortBy('width').forEach(function (column) {
                if (diff > 0) {
                  column.width++;
                  diff--;
                }
              });
            }
          })();
        }
        this._columns = columns;
      }
    }, {
      key: 'updateColumnWidth',
      value: function updateColumnWidth(id, width) {
        var column = this._columns.findBy('id', id);
        var previousWidth = column.width;
        column.width = width;
        var last = this._columns[this._columns.length - 1];
        var lastColumnWidth = last.width + previousWidth - width;
        last.width = lastColumnWidth;
        this.processColumns();
      }
    }, {
      key: 'toggleVisibility',
      value: function toggleVisibility(id) {
        var column = this._columnVisibility.findBy('id', id);
        column.visible = !column.visible;
        if (!this._columnVisibility.isAny('visible')) {
          // If this column was the last visible column
          // cancel toggling and set back to `true`.
          column.visible = true;
        }
        this.resetWidths();
      }
    }, {
      key: 'processColumns',
      value: function processColumns() {
        var _this4 = this;

        var columns = this._columns;
        var prevLeft = void 0,
            prevWidth = void 0;
        columns = columns.map(function (_ref3, index) {
          var id = _ref3.id,
              name = _ref3.name,
              visible = _ref3.visible,
              width = _ref3.width;

          var last = _this4._columns[_this4._columns.length - 1];
          var left = 0;
          if (index > 0) {
            left = prevWidth + prevLeft;
          }
          var maxWidth = width + last.width - _this4.minWidth;
          prevLeft = left;
          prevWidth = width;
          return { id: id, name: name, width: width, left: left, maxWidth: maxWidth };
        });
        this.saveVisibility();
        this.saveWidths();
        set(this, 'columns', columns);
      }
    }, {
      key: 'saveVisibility',
      value: function saveVisibility() {
        var saved = this.storage.getItem(this.getStorageKey()) || {};
        saved.columnVisibility = this._columnVisibility.reduce(function (obj, _ref4) {
          var id = _ref4.id,
              visible = _ref4.visible;

          obj[id] = visible;
          return obj;
        }, {});
        this.storage.setItem(this.getStorageKey(), saved);
      }
    }, {
      key: 'resetWidths',
      value: function resetWidths() {
        var saved = this.storage.getItem(this.getStorageKey()) || {};
        delete saved.columnWidths;
        this.storage.setItem(this.getStorageKey(), saved);
        this.build();
      }
    }, {
      key: 'saveWidths',
      value: function saveWidths() {
        var columns = {};
        var totalWidth = this._columns.reduce(function (sum, _ref5) {
          var width = _ref5.width;
          return sum + width;
        }, 0);
        this._columns.forEach(function (_ref6) {
          var id = _ref6.id,
              width = _ref6.width;

          columns[id] = width / totalWidth;
        });
        var saved = this.storage.getItem(this.getStorageKey()) || {};
        saved.columnWidths = columns;
        this.storage.setItem(this.getStorageKey(), saved);
      }
    }, {
      key: 'getStorageKey',
      value: function getStorageKey() {
        return 'x-list__' + this.key;
      }
    }, {
      key: 'getSavedPercentage',
      value: function getSavedPercentage(id) {
        var saved = this.storage.getItem(this.getStorageKey()) || {};
        return saved.columnWidths && saved.columnWidths[id];
      }
    }]);

    return _class;
  }();

  exports.default = _class;
});
define('ember-inspector/mixins/row-events', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Mixin = _ember.default.Mixin,
      assert = _ember.default.assert,
      isNone = _ember.default.isNone,
      readOnly = _ember.default.computed.readOnly;
  exports.default = Mixin.create({
    /**
     * The current component's index. Pass this through the
     * template so the mixin can figure out which row this component
     * belongs to.
     *
     * @property index
     * @default null
     */
    index: null,

    /**
     * Action to trigger when a row is clicked.
     *
     * @property on-click
     * @type {Function}
     */
    'on-click': function onClick() {},


    /**
     * Action to trigger when a row mouseenter event is triggered.
     *
     * @property on-mouseenter
     * @type {Function}
     */
    'on-mouseenter': function onMouseenter() {},


    /**
     * Action to trigger when a row mouseleave event is triggered.
     *
     * @property on-mouseleave
     * @type {Function}
     */
    'on-mouseleave': function onMouseleave() {},


    /**
     * An alias to the list's `rowEvents` property.
     * The component must have a `list` property containing
     * the yielded `x-list`.
     *
     * @property rowEvents
     * @type {Ember.Object}
     */
    rowEvents: readOnly('list.rowEvents'),

    /**
     * Hook called on element insert. Sets up event listeners.
     *
     * @method didInsertElement
     */
    didInsertElement: function didInsertElement() {
      assert('You must pass `list` to a component that listens to row-events', !!this.get('list'));
      assert('You must pass `index` to a component that listens to row-events', !isNone(this.get('index')));

      this.get('rowEvents').on('click', this, 'handleEvent');
      this.get('rowEvents').on('mouseleave', this, 'handleEvent');
      this.get('rowEvents').on('mouseenter', this, 'handleEvent');
      return this._super.apply(this, arguments);
    },


    /**
     * Hook called before destroying the element.
     * Cleans up event listeners.
     *
     * @method willDestroyElement
     */
    willDestroyElement: function willDestroyElement() {
      this.get('rowEvents').off('click', this, 'handleEvent');
      this.get('rowEvents').off('mouseleave', this, 'handleEvent');
      this.get('rowEvents').off('mouseenter', this, 'handleEvent');
      return this._super.apply(this, arguments);
    },


    /**
     * Makes sure the event triggered matches the current
     * component's index.
     *
     * @method handleEvent
     * @param {Object}
     *  - {Number} index The current row index
     *  - {String} type Event type
     */
    handleEvent: function handleEvent(_ref) {
      var index = _ref.index,
          type = _ref.type;

      if (index === this.get('index')) {
        if (this.get('on-' + type)) {
          this.get('on-' + type)();
        }
      }
    }
  });
});
define("ember-inspector/models/promise", ["exports", "ember", "ember-inspector/utils/escape-reg-exp", "ember-new-computed"], function (exports, _ember, _escapeRegExp, _emberNewComputed) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var $ = _ember.default.$,
      observer = _ember.default.observer,
      typeOf = _ember.default.typeOf,
      _Ember$computed = _ember.default.computed,
      or = _Ember$computed.or,
      equal = _Ember$computed.equal,
      not = _Ember$computed.not;


  var dateComputed = function dateComputed() {
    return (0, _emberNewComputed.default)({
      get: function get() {
        return null;
      },
      set: function set(key, date) {
        if (typeOf(date) === 'date') {
          return date;
        } else if (typeof date === 'number' || typeof date === 'string') {
          return new Date(date);
        }
        return null;
      }
    });
  };

  exports.default = _ember.default.Object.extend({
    createdAt: dateComputed(),
    settledAt: dateComputed(),

    parent: null,

    level: (0, _emberNewComputed.default)('parent.level', function () {
      var parent = this.get('parent');
      if (!parent) {
        return 0;
      }
      return parent.get('level') + 1;
    }),

    isSettled: or('isFulfilled', 'isRejected'),

    isFulfilled: equal('state', 'fulfilled'),

    isRejected: equal('state', 'rejected'),

    isPending: not('isSettled'),

    children: (0, _emberNewComputed.default)(function () {
      return [];
    }),

    pendingBranch: (0, _emberNewComputed.default)('isPending', 'children.@each.pendingBranch', function () {
      return this.recursiveState('isPending', 'pendingBranch');
    }),

    rejectedBranch: (0, _emberNewComputed.default)('isRejected', 'children.@each.rejectedBranch', function () {
      return this.recursiveState('isRejected', 'rejectedBranch');
    }),

    fulfilledBranch: (0, _emberNewComputed.default)('isFulfilled', 'children.@each.fulfilledBranch', function () {
      return this.recursiveState('isFulfilled', 'fulfilledBranch');
    }),

    recursiveState: function recursiveState(prop, cp) {
      if (this.get(prop)) {
        return true;
      }
      for (var i = 0; i < this.get('children.length'); i++) {
        if (this.get('children').objectAt(i).get(cp)) {
          return true;
        }
      }
      return false;
    },


    // Need this observer because CP dependent keys do not support nested arrays
    // TODO: This can be so much better
    stateChanged: observer('pendingBranch', 'fulfilledBranch', 'rejectedBranch', function () {
      if (!this.get('parent')) {
        return;
      }
      if (this.get('pendingBranch') && !this.get('parent.pendingBranch')) {
        this.get('parent').notifyPropertyChange('fulfilledBranch');
        this.get('parent').notifyPropertyChange('rejectedBranch');
        this.get('parent').notifyPropertyChange('pendingBranch');
      } else if (this.get('fulfilledBranch') && !this.get('parent.fulfilledBranch')) {
        this.get('parent').notifyPropertyChange('fulfilledBranch');
        this.get('parent').notifyPropertyChange('rejectedBranch');
        this.get('parent').notifyPropertyChange('pendingBranch');
      } else if (this.get('rejectedBranch') && !this.get('parent.rejectedBranch')) {
        this.get('parent').notifyPropertyChange('fulfilledBranch');
        this.get('parent').notifyPropertyChange('rejectedBranch');
        this.get('parent').notifyPropertyChange('pendingBranch');
      }
    }),

    updateParentLabel: observer('label', 'parent', function () {
      this.addBranchLabel(this.get('label'), true);
    }),

    addBranchLabel: function addBranchLabel(label, replace) {
      if (_ember.default.isEmpty(label)) {
        return;
      }
      if (replace) {
        this.set('branchLabel', label);
      } else {
        this.set('branchLabel', this.get('branchLabel') + " " + label);
      }

      var parent = this.get('parent');
      if (parent) {
        parent.addBranchLabel(label);
      }
    },


    branchLabel: '',

    matches: function matches(val) {
      return !!this.get('branchLabel').toLowerCase().match(new RegExp(".*" + (0, _escapeRegExp.default)(val.toLowerCase()) + ".*"));
    },
    matchesExactly: function matchesExactly(val) {
      return !!(this.get('label') || '').toLowerCase().match(new RegExp(".*" + (0, _escapeRegExp.default)(val.toLowerCase()) + ".*"));
    },


    // EXPANDED / COLLAPSED PROMISES

    isExpanded: false,

    isManuallyExpanded: undefined,

    stateOrParentChanged: observer('isPending', 'isFulfilled', 'isRejected', 'parent', function () {
      var parent = this.get('parent');
      if (parent) {
        _ember.default.run.once(parent, 'recalculateExpanded');
      }
    }),

    _findTopParent: function _findTopParent() {
      var parent = this.get('parent');
      if (!parent) {
        return this;
      } else {
        return parent._findTopParent();
      }
    },
    recalculateExpanded: function recalculateExpanded() {
      var isExpanded = false;
      if (this.get('isManuallyExpanded') !== undefined) {
        isExpanded = this.get('isManuallyExpanded');
      } else {
        var children = this._allChildren();
        for (var i = 0, l = children.length; i < l; i++) {
          var child = children[i];
          if (child.get('isRejected')) {
            isExpanded = true;
          }
          if (child.get('isPending') && !child.get('parent.isPending')) {
            isExpanded = true;
          }
          if (isExpanded) {
            break;
          }
        }
        var parents = this._allParents();
        if (isExpanded) {
          parents.forEach(function (parent) {
            parent.set('isExpanded', true);
          });
        } else if (this.get('parent.isExpanded')) {
          this.get('parent').recalculateExpanded();
        }
      }
      this.set('isExpanded', isExpanded);
      return isExpanded;
    },


    isVisible: (0, _emberNewComputed.default)('parent.isExpanded', 'parent', 'parent.isVisible', function () {
      if (this.get('parent')) {
        return this.get('parent.isExpanded') && this.get('parent.isVisible');
      }
      return true;
    }),

    _allChildren: function _allChildren() {
      var children = $.extend([], this.get('children'));
      children.forEach(function (item) {
        children = $.merge(children, item._allChildren());
      });
      return children;
    },
    _allParents: function _allParents() {
      var parent = this.get('parent');
      if (parent) {
        return $.merge([parent], parent._allParents());
      } else {
        return [];
      }
    }
  });
});
define('ember-inspector/port', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var computed = _ember.default.computed;
  exports.default = _ember.default.Object.extend(_ember.default.Evented, {
    applicationId: undefined,

    detectedApplications: computed(function () {
      return [];
    }),

    init: function init() {
      var _this = this;

      var detectedApplications = this.get('detectedApplications');
      this.get('adapter').onMessageReceived(function (message) {
        if (!message.applicationId) {
          return;
        }
        if (!_this.get('applicationId')) {
          _this.set('applicationId', message.applicationId);
        }
        // save list of application ids
        if (detectedApplications.indexOf(message.applicationId) === -1) {
          detectedApplications.pushObject(message.applicationId);
        }

        var applicationId = _this.get('applicationId');
        if (applicationId === message.applicationId) {
          _this.trigger(message.type, message, applicationId);
        }
      });
    },
    send: function send(type, message) {
      message = message || {};
      message.type = type;
      message.from = 'devtools';
      message.applicationId = this.get('applicationId');
      this.get('adapter').sendMessage(message);
    }
  });
});
define('ember-inspector/resolver', ['exports', 'ember-resolver'], function (exports, _emberResolver) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _emberResolver.default;
});
define('ember-inspector/router', ['exports', 'ember', 'ember-inspector/config/environment'], function (exports, _ember, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var Router = _ember.default.Router.extend({
    location: _environment.default.locationType,
    rootURL: _environment.default.rootURL
  });

  Router.map(function () {
    this.route('app-detected', { path: '/', resetNamespace: true }, function () {
      this.route('view-tree', { path: '/', resetNamespace: true });
      this.route('route-tree', { resetNamespace: true });

      this.route('data', { resetNamespace: true }, function () {
        this.route('model-types', { resetNamespace: true }, function () {
          this.route('model-type', { path: '/:type_id', resetNamespace: true }, function () {
            this.route('records', { resetNamespace: true });
          });
        });
      });

      this.route('promise-tree', { resetNamespace: true });

      this.route('info', { resetNamespace: true });
      this.route('render-tree', { resetNamespace: true });
      this.route('container-types', { resetNamespace: true }, function () {
        this.route('container-type', { path: '/:type_id', resetNamespace: true });
      });

      this.route('deprecations', { resetNamespace: true });
    });
  });

  exports.default = Router;
});
define('ember-inspector/routes/app-detected', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Route = _ember.default.Route,
      Promise = _ember.default.RSVP.Promise,
      getOwner = _ember.default.getOwner;
  exports.default = Route.extend({
    model: function model() {
      var _this = this;

      var port = this.get('port');
      return new Promise(function (resolve) {
        port.on('general:applicationBooted', _this, function (message) {
          if (message.booted) {
            port.off('general:applicationBooted');
            resolve();
          }
        });
        port.send('general:applicationBooted');
      });
    },
    setupController: function setupController() {
      this.controllerFor('application').set('emberApplication', true);
      this.get('port').one('general:reset', this, this.reset);
    },
    reset: function reset() {
      getOwner(this).lookup('application:main').reset();
    },
    deactivate: function deactivate() {
      this.get('port').off('general:applicationBooted');
      this.get('port').off('general:reset', this, this.reset);
    }
  });
});
define('ember-inspector/routes/application', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Route = _ember.default.Route,
      inject = _ember.default.inject,
      run = _ember.default.run,
      NativeArray = _ember.default.NativeArray;
  var service = inject.service;
  var schedule = run.schedule;

  var set = _ember.default.set;
  var get = _ember.default.get;

  exports.default = Route.extend({
    setupController: function setupController(controller) {
      controller.set('mixinStack', []);
      var port = this.get('port');
      port.on('objectInspector:updateObject', this, this.updateObject);
      port.on('objectInspector:updateProperty', this, this.updateProperty);
      port.on('objectInspector:updateErrors', this, this.updateErrors);
      port.on('objectInspector:droppedObject', this, this.droppedObject);
      port.on('deprecation:count', this, this.setDeprecationCount);
      port.send('deprecation:getCount');
    },
    deactivate: function deactivate() {
      var port = this.get('port');
      port.off('objectInspector:updateObject', this, this.updateObject);
      port.off('objectInspector:updateProperty', this, this.updateProperty);
      port.off('objectInspector:updateErrors', this, this.updateErrors);
      port.off('objectInspector:droppedObject', this, this.droppedObject);
      port.off('deprecation:count', this, this.setDeprecationCount);
    },
    updateObject: function updateObject(options) {
      var details = options.details,
          name = options.name,
          property = options.property,
          objectId = options.objectId,
          errors = options.errors;

      NativeArray.apply(details);
      details.forEach(arrayize);

      var controller = this.get('controller');

      if (options.parentObject) {
        controller.pushMixinDetails(name, property, objectId, details);
      } else {
        controller.activateMixinDetails(name, objectId, details, errors);
      }

      this.send('expandInspector');
    },
    setDeprecationCount: function setDeprecationCount(message) {
      this.controller.set('deprecationCount', message.count);
    },
    updateProperty: function updateProperty(options) {
      var detail = this.get('controller.mixinDetails.mixins').objectAt(options.mixinIndex);
      var property = get(detail, 'properties').findBy('name', options.property);
      set(property, 'value', options.value);
    },
    updateErrors: function updateErrors(options) {
      var mixinDetails = this.get('controller.mixinDetails');
      if (mixinDetails) {
        if (get(mixinDetails, 'objectId') === options.objectId) {
          set(mixinDetails, 'errors', options.errors);
        }
      }
    },
    droppedObject: function droppedObject(message) {
      this.get('controller').droppedObject(message.objectId);
    },


    /**
     * Service used to broadcast changes to the application's layout
     * such as toggling of the object inspector.
     *
     * @property layout
     * @type {Service}
     */
    layout: service(),

    actions: {
      expandInspector: function expandInspector() {
        var _this = this;

        this.set("controller.inspectorExpanded", true);
        // Broadcast that tables have been resized (used by `x-list`).
        schedule('afterRender', function () {
          _this.get('layout').trigger('resize', { source: 'object-inspector' });
        });
      },
      toggleInspector: function toggleInspector() {
        var _this2 = this;

        this.toggleProperty("controller.inspectorExpanded");
        // Broadcast that tables have been resized (used by `x-list`).
        schedule('afterRender', function () {
          _this2.get('layout').trigger('resize', { source: 'object-inspector' });
        });
      },
      inspectObject: function inspectObject(objectId) {
        if (objectId) {
          this.get('port').send('objectInspector:inspectById', { objectId: objectId });
        }
      },
      setIsDragging: function setIsDragging(isDragging) {
        this.set('controller.isDragging', isDragging);
      },
      refreshPage: function refreshPage() {
        // If the adapter defined a `reloadTab` method, it means
        // they prefer to handle the reload themselves
        if (typeof this.get('adapter').reloadTab === 'function') {
          this.get('adapter').reloadTab();
        } else {
          // inject ember_debug as quickly as possible in chrome
          // so that promises created on dom ready are caught
          this.get('port').send('general:refresh');
          this.get('adapter').willReload();
        }
      }
    }
  });


  function arrayize(mixin) {
    NativeArray.apply(mixin.properties);
  }
});
define("ember-inspector/routes/container-type", ["exports", "ember", "ember-inspector/routes/tab"], function (exports, _ember, _tab) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var get = _ember.default.get;
  var Promise = _ember.default.RSVP.Promise;
  exports.default = _tab.default.extend({
    setupController: function setupController(controller) {
      controller.setProperties({
        search: '',
        searchVal: ''
      });
      this._super.apply(this, arguments);
    },
    model: function model(params) {
      var type = params.type_id;
      var port = this.get('port');
      return new Promise(function (resolve, reject) {
        port.one('container:instances', function (message) {
          if (message.status === 200) {
            resolve(message.instances);
          } else {
            reject(message);
          }
        });
        port.send('container:getInstances', { containerType: type });
      });
    },


    actions: {
      error: function error(err) {
        if (err && err.status === 404) {
          this.transitionTo('container-types.index');
          return false;
        }
      },
      sendInstanceToConsole: function sendInstanceToConsole(obj) {
        this.get('port').send('container:sendInstanceToConsole', { name: get(obj, 'fullName') });
      }
    }
  });
});
define('ember-inspector/routes/container-types', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Route = _ember.default.Route,
      Promise = _ember.default.RSVP.Promise;
  exports.default = Route.extend({
    model: function model() {
      var port = this.get('port');
      return new Promise(function (resolve) {
        port.one('container:types', function (message) {
          resolve(message.types);
        });
        port.send('container:getTypes');
      });
    },

    actions: {
      reload: function reload() {
        this.refresh();
      }
    }
  });
});
define("ember-inspector/routes/container-types/index", ["exports", "ember-inspector/routes/tab"], function (exports, _tab) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _tab.default;
});
define('ember-inspector/routes/data/index', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Promise = _ember.default.RSVP.Promise;
  exports.default = _ember.default.Route.extend({
    model: function model() {
      var route = this;
      return new Promise(function (resolve) {
        route.get('port').one('data:hasAdapter', function (message) {
          resolve(message.hasAdapter);
        });
        route.get('port').send('data:checkAdapter');
      });
    },
    afterModel: function afterModel(model) {
      if (model) {
        this.transitionTo('model-types');
      }
    }
  });
});
define("ember-inspector/routes/deprecations", ["exports", "ember", "ember-inspector/routes/tab"], function (exports, _ember, _tab) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var set = _ember.default.set;

  exports.default = _tab.default.extend({
    setupController: function setupController() {
      var port = this.get('port');
      port.on('deprecation:deprecationsAdded', this, this.deprecationsAdded);
      port.send('deprecation:watch');
      this._super.apply(this, arguments);
    },
    model: function model() {
      return [];
    },
    deactivate: function deactivate() {
      this.get('port').off('deprecation:deprecationsAdded', this, this.deprecationsAdded);
    },
    deprecationsAdded: function deprecationsAdded(message) {
      var model = this.get('currentModel');
      message.deprecations.forEach(function (item) {
        var record = model.findBy('id', item.id);
        if (record) {
          set(record, 'count', item.count);
          set(record, 'sources', item.sources);
          set(record, 'url', item.url);
        } else {
          model.pushObject(item);
        }
      });
    },


    actions: {
      clear: function clear() {
        this.get('port').send('deprecation:clear');
        this.get('currentModel').clear();
      }
    }
  });
});
define("ember-inspector/routes/info", ["exports", "ember", "ember-inspector/routes/tab"], function (exports, _ember, _tab) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Promise = _ember.default.RSVP.Promise,
      computed = _ember.default.computed;
  var oneWay = computed.oneWay;
  exports.default = _tab.default.extend({
    version: oneWay('config.VERSION').readOnly(),

    model: function model() {
      var version = this.get('version');
      var port = this.get('port');
      return new Promise(function (resolve) {
        port.one('general:libraries', function (message) {
          message.libraries.insertAt(0, {
            name: 'Ember Inspector',
            version: version
          });
          resolve(message.libraries);
        });
        port.send('general:getLibraries');
      });
    }
  });
});
define('ember-inspector/routes/model-type', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Promise = _ember.default.RSVP.Promise;
  exports.default = _ember.default.Route.extend({
    setupController: function setupController(controller, model) {
      this._super(controller, model);
      this.controllerFor('model-types').set('selected', model);
    },
    model: function model(params) {
      var _this = this;

      return new Promise(function (resolve) {
        var type = _this.modelFor('model-types').findBy('name', decodeURIComponent(params.type_id));
        if (type) {
          resolve(type);
        } else {
          _this.transitionTo('model-types.index');
        }
      });
    },
    deactivate: function deactivate() {
      this.controllerFor('model-types').set('selected', null);
    },
    serialize: function serialize(model) {
      return { type_id: _ember.default.get(model, 'name') };
    }
  });
});
define("ember-inspector/routes/model-types", ["exports", "ember", "ember-inspector/routes/tab"], function (exports, _ember, _tab) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Promise = _ember.default.RSVP.Promise;
  exports.default = _tab.default.extend({
    setupController: function setupController(controller, model) {
      this._super(controller, model);
      this.get('port').on('data:modelTypesAdded', this, this.addModelTypes);
      this.get('port').on('data:modelTypesUpdated', this, this.updateModelTypes);
    },
    model: function model() {
      var port = this.get('port');
      return new Promise(function (resolve) {
        port.one('data:modelTypesAdded', this, function (message) {
          resolve(message.modelTypes);
        });
        port.send('data:getModelTypes');
      });
    },
    deactivate: function deactivate() {
      this.get('port').off('data:modelTypesAdded', this, this.addModelTypes);
      this.get('port').off('data:modelTypesUpdated', this, this.updateModelTypes);
      this.get('port').send('data:releaseModelTypes');
    },
    addModelTypes: function addModelTypes(message) {
      this.get('currentModel').pushObjects(message.modelTypes);
    },
    updateModelTypes: function updateModelTypes(message) {
      var route = this;
      message.modelTypes.forEach(function (modelType) {
        var currentType = route.get('currentModel').findBy('objectId', modelType.objectId);
        _ember.default.set(currentType, 'count', modelType.count);
      });
    }
  });
});
define("ember-inspector/routes/promise-tree", ["exports", "ember", "ember-inspector/routes/tab"], function (exports, _ember, _tab) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Promise = _ember.default.RSVP.Promise;
  exports.default = _tab.default.extend({
    model: function model() {
      var _this = this;

      // block rendering until first batch arrives
      // Helps prevent flashing of "please refresh the page"
      return new Promise(function (resolve) {
        _this.get('assembler').one('firstMessageReceived', function () {
          resolve(_this.get('assembler.topSort'));
        });
        _this.get('assembler').start();
      });
    },
    setupController: function setupController() {
      this._super.apply(this, arguments);
      this.get('port').on('promise:instrumentWithStack', this, this.setInstrumentWithStack);
      this.get('port').send('promise:getInstrumentWithStack');
    },
    setInstrumentWithStack: function setInstrumentWithStack(message) {
      this.set('controller.instrumentWithStack', message.instrumentWithStack);
    },
    deactivate: function deactivate() {
      this.get('assembler').stop();
      this.get('port').off('promse:getInstrumentWithStack', this, this.setInstrumentWithStack);
    }
  });
});
define("ember-inspector/routes/records", ["exports", "ember", "ember-inspector/routes/tab"], function (exports, _ember, _tab) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });


  var set = _ember.default.set;

  exports.default = _tab.default.extend({
    setupController: function setupController(controller, model) {
      this._super(controller, model);

      var type = this.modelFor('model_type');

      controller.set('modelType', type);

      this.get('port').on('data:recordsAdded', this, this.addRecords);
      this.get('port').on('data:recordsUpdated', this, this.updateRecords);
      this.get('port').on('data:recordsRemoved', this, this.removeRecords);
      this.get('port').one('data:filters', this, function (message) {
        this.set('controller.filters', message.filters);
      });
      this.get('port').send('data:getFilters');
      this.get('port').send('data:getRecords', { objectId: type.objectId });
    },
    model: function model() {
      return [];
    },
    deactivate: function deactivate() {
      this.get('port').off('data:recordsAdded', this, this.addRecords);
      this.get('port').off('data:recordsUpdated', this, this.updateRecords);
      this.get('port').off('data:recordsRemoved', this, this.removeRecords);
      this.get('port').send('data:releaseRecords');
    },
    updateRecords: function updateRecords(message) {
      var _this = this;

      message.records.forEach(function (record) {
        var currentRecord = _this.get('currentModel').findBy('objectId', record.objectId);
        if (currentRecord) {
          set(currentRecord, 'columnValues', record.columnValues);
          set(currentRecord, 'filterValues', record.filterValues);
          set(currentRecord, 'searchIndex', record.searchIndex);
          set(currentRecord, 'color', record.color);
        }
      });
    },
    addRecords: function addRecords(message) {
      this.get('currentModel').pushObjects(message.records);
    },
    removeRecords: function removeRecords(message) {
      this.get('currentModel').removeAt(message.index, message.count);
    }
  });
});
define("ember-inspector/routes/render-tree", ["exports", "ember", "ember-inspector/routes/tab"], function (exports, _ember, _tab) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Promise = _ember.default.RSVP.Promise;
  exports.default = _tab.default.extend({
    model: function model() {
      var port = this.get('port');
      return new Promise(function (resolve) {
        port.one('render:profilesAdded', function (message) {
          resolve(message.profiles);
        });
        port.send('render:watchProfiles');
      });
    },
    setupController: function setupController(controller, model) {
      this._super.apply(this, arguments);
      if (model.length === 0) {
        controller.set('initialEmpty', true);
      }
      var port = this.get('port');
      port.on('render:profilesUpdated', this, this.profilesUpdated);
      port.on('render:profilesAdded', this, this.profilesAdded);
    },
    deactivate: function deactivate() {
      var port = this.get('port');
      port.off('render:profilesUpdated', this, this.profilesUpdated);
      port.off('render:profilesAdded', this, this.profilesAdded);
      port.send('render:releaseProfiles');
    },
    profilesUpdated: function profilesUpdated(message) {
      this.set('controller.model', message.profiles);
    },
    profilesAdded: function profilesAdded(message) {
      var model = this.get('controller.model');
      var profiles = message.profiles;

      model.pushObjects(profiles);
    },


    actions: {
      clearProfiles: function clearProfiles() {
        this.get('port').send('render:clear');
      }
    }

  });
});
define("ember-inspector/routes/route-tree", ["exports", "ember", "ember-inspector/routes/tab"], function (exports, _ember, _tab) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var $ = _ember.default.$;

  exports.default = _tab.default.extend({
    setupController: function setupController() {
      this.get('port').on('route:currentRoute', this, this.setCurrentRoute);
      this.get('port').send('route:getCurrentRoute');
      this.get('port').on('route:routeTree', this, this.setTree);
      this.get('port').send('route:getTree');
    },
    deactivate: function deactivate() {
      this.get('port').off('route:currentRoute');
      this.get('port').off('route:routeTree', this, this.setTree);
    },
    setCurrentRoute: function setCurrentRoute(message) {
      this.get('controller').set('currentRoute', message.name);
    },
    setTree: function setTree(options) {
      var routeArray = topSort(options.tree);
      this.set('controller.model', routeArray);
    }
  });


  function topSort(tree, list) {
    list = list || [];
    var route = $.extend({}, tree);
    delete route.children;
    // Firt node in the tree doesn't have a value
    if (route.value) {
      route.parentCount = route.parentCount || 0;
      list.push(route);
    }
    tree.children = tree.children || [];
    tree.children.forEach(function (child) {
      child.parentCount = route.parentCount + 1;
      topSort(child, list);
    });
    return list;
  }
});
define('ember-inspector/routes/tab', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _ember.default.Route.extend({
    renderTemplate: function renderTemplate() {
      this.render();
      try {
        this.render(this.get('routeName').replace(/\./g, '/') + '-toolbar', {
          into: 'application',
          outlet: 'toolbar'
        });
      } catch (e) {}
    }
  });
});
define("ember-inspector/routes/view-tree", ["exports", "ember", "ember-inspector/routes/tab"], function (exports, _ember, _tab) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var $ = _ember.default.$;

  exports.default = _tab.default.extend({
    model: function model() {
      return [];
    },
    setupController: function setupController() {
      this._super.apply(this, arguments);
      this.get('port').on('view:viewTree', this, this.setViewTree);
      this.get('port').on('view:stopInspecting', this, this.stopInspecting);
      this.get('port').on('view:startInspecting', this, this.startInspecting);
      this.get('port').on('view:inspectDOMElement', this, this.inspectDOMElement);
      this.get('port').send('view:getTree');
    },
    deactivate: function deactivate() {
      this.get('port').off('view:viewTree', this, this.setViewTree);
      this.get('port').off('view:stopInspecting', this, this.stopInspecting);
      this.get('port').off('view:startInspecting', this, this.startInspecting);
      this.get('port').off('view:inspectDOMElement', this, this.inspectDOMElement);
    },
    setViewTree: function setViewTree(options) {
      var viewArray = topSort(options.tree);
      this.set('controller.model', viewArray);
    },
    startInspecting: function startInspecting() {
      this.set('controller.inspectingViews', true);
    },
    stopInspecting: function stopInspecting() {
      this.set('controller.inspectingViews', false);
    },
    inspectDOMElement: function inspectDOMElement(_ref) {
      var elementSelector = _ref.elementSelector;

      this.get('port.adapter').inspectDOMElement(elementSelector);
    }
  });


  function topSort(tree, list) {
    list = list || [];
    var view = $.extend({}, tree);
    view.parentCount = view.parentCount || 0;
    delete view.children;
    list.push(view);
    tree.children.forEach(function (child) {
      child.parentCount = view.parentCount + 1;
      topSort(child, list);
    });
    return list;
  }
});
define('ember-inspector/schemas/info-list', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    columns: [{
      id: 'library',
      name: 'Library',
      visible: true
    }, {
      id: 'version',
      name: 'Version',
      visible: true
    }]
  };
});
define('ember-inspector/schemas/promise-tree', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    columns: [{
      id: 'label',
      name: 'Label',
      visible: true
    }, {
      id: 'state',
      name: 'State',
      visible: true
    }, {
      id: 'settled-value',
      name: 'Fulfillment / Rejection value',
      visible: true
    }, {
      id: 'time',
      name: 'Time to settle',
      visible: true
    }]
  };
});
define('ember-inspector/schemas/render-tree', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    columns: [{
      id: 'name',
      name: 'Name',
      visible: true
    }, {
      id: 'render-time',
      name: 'Render time',
      visible: true,
      numeric: true
    }, {
      id: 'timestamp',
      name: 'Timestamp',
      visible: true,
      numeric: true
    }]
  };
});
define('ember-inspector/schemas/route-tree', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    columns: [{
      id: 'name',
      name: 'Route Name',
      visible: true
    }, {
      id: 'route',
      name: 'Route',
      visible: true
    }, {
      id: 'controller',
      name: 'Controller',
      visible: true
    }, {
      id: 'template',
      name: 'Template',
      visible: true
    }, {
      id: 'url',
      name: 'URL',
      visible: true
    }]
  };
});
define('ember-inspector/schemas/view-tree', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    columns: [{
      id: 'name',
      name: 'Name',
      visible: true
    }, {
      id: 'template',
      name: 'Template',
      visible: true
    }, {
      id: 'model',
      name: 'Model',
      visible: true
    }, {
      id: 'controller',
      name: 'Controller',
      visible: true
    }, {
      id: 'component',
      name: 'View / Component',
      visible: true
    }, {
      id: 'duration',
      name: 'Duration',
      visible: true
    }]
  };
});
define('ember-inspector/services/in-viewport', ['exports', 'smoke-and-mirrors/services/in-viewport'], function (exports, _inViewport) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = _inViewport.default;
});
define('ember-inspector/services/layout', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Service = _ember.default.Service,
      Evented = _ember.default.Evented;
  exports.default = Service.extend(Evented, {
    /**
     * Stores the app's content height. This property is kept up-to-date
     * by the `main-content` component.
     *
     * @property contentHeight
     * @type {Number}
     */
    contentHeight: null,

    /**
     * This is called by `main-content` whenever a window resize is detected
     * and the app's content height has changed. We therefore update the
     * `contentHeight` property and notify all listeners (mostly lists).
     *
     * @method updateContentHeight
     * @param  {Number} height The new app content height
     */
    updateContentHeight: function updateContentHeight(height) {
      this.set('contentHeight', height);
      this.trigger('content-height-update', height);
    }
  });
});
define('ember-inspector/services/storage/local', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Service = _ember.default.Service,
      isNone = _ember.default.isNone;
  var parse = JSON.parse,
      stringify = JSON.stringify;

  var LOCAL_STORAGE_SUPPORTED = void 0;

  var LocalStorage = Service.extend({
    getItem: function getItem(key) {
      var json = localStorage.getItem(key);
      return json && parse(json);
    },
    setItem: function setItem(key, value) {
      if (!isNone(value)) {
        value = stringify(value);
      }
      return localStorage.setItem(key, value);
    },
    removeItem: function removeItem(key) {
      return localStorage.removeItem(key);
    },
    keys: function keys() {
      var keys = [];
      for (var i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i));
      }
      return keys;
    }
  });

  try {
    localStorage.setItem('test', 0);
    localStorage.removeItem('test');
    LOCAL_STORAGE_SUPPORTED = true;
  } catch (e) {
    // Security setting in chrome that disables storage for third party
    // throws an error when `localStorage` is accessed. Safari in Private mode
    // also throws an error.
    LOCAL_STORAGE_SUPPORTED = false;
  }

  LocalStorage.reopenClass({
    /**
     * Checks if `localStorage` is supported.
     *
     * @property SUPPORTED
     * @type {Boolean}
     */
    SUPPORTED: LOCAL_STORAGE_SUPPORTED
  });

  exports.default = LocalStorage;
});
define('ember-inspector/services/storage/memory', ['exports', 'ember'], function (exports, _ember) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var Service = _ember.default.Service,
      computed = _ember.default.computed;
  var _keys = Object.keys;
  exports.default = Service.extend({
    /**
     * Where data is stored.
     *
     * @property hash
     * @type {Object}
     */
    hash: computed(function () {
      return {};
    }),

    /**
     * Reads a stored item.
     *
     * @method getItem
     * @param  {String} key The cache key
     * @return {Object}     The stored value
     */
    getItem: function getItem(key) {
      return this.get('hash')[key];
    },


    /**
     * Stores an item in memory.
     *
     * @method setItem
     * @param {String} key The cache key
     * @param {Object} value The item
     */
    setItem: function setItem(key, value) {
      this.get('hash')[key] = value;
    },


    /**
     * Deletes an entry from memory storage.
     *
     * @method removeItem
     * @param  {String} key The cache key
     */
    removeItem: function removeItem(key) {
      delete this.get('hash')[key];
    },


    /**
     * Returns the list keys of saved entries in memory.
     *
     * @method keys
     * @return {Array}  The array of keys
     */
    keys: function keys() {
      return _keys(this.get('hash'));
    }
  });
});
define("ember-inspector/templates/-main", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "fRbKjRGu", "block": "{\"statements\":[[11,\"div\",[]],[15,\"class\",\"split split--main\"],[13],[0,\"\\n\"],[6,[\"draggable-column\"],null,[[\"width\",\"classes\"],[[28,[\"navWidth\"]],\"split__panel split__panel--sidebar-1\"]],{\"statements\":[[0,\"    \"],[11,\"div\",[]],[15,\"class\",\"split__panel__hd\"],[13],[0,\"\\n      \"],[1,[26,[\"iframe-picker\"]],false],[0,\"\\n    \"],[14],[0,\"\\n    \"],[11,\"div\",[]],[15,\"class\",\"split__panel__bd\"],[13],[0,\"\\n      \"],[19,\"nav\"],[0,\"\\n    \"],[14],[0,\"\\n    \"],[11,\"div\",[]],[15,\"class\",\"split__panel__ft\"],[13],[0,\"\\n      \"],[11,\"a\",[]],[15,\"target\",\"_blank\"],[15,\"href\",\"https://github.com/emberjs/ember-inspector/issues\"],[13],[0,\"\\n        Submit an Issue\\n      \"],[14],[0,\"\\n    \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"\\n  \"],[11,\"div\",[]],[15,\"class\",\"split__panel\"],[13],[0,\"\\n    \"],[11,\"div\",[]],[15,\"class\",\"split__panel__hd\"],[13],[0,\"\\n      \"],[1,[33,[\"outlet\"],[\"toolbar\"],null],false],[0,\"\\n\"],[6,[\"unless\"],[[28,[\"inspectorExpanded\"]]],null,{\"statements\":[[0,\"        \"],[1,[33,[\"sidebar-toggle\"],null,[[\"action\",\"side\",\"isExpanded\",\"classNames\"],[\"toggleInspector\",\"right\",false,\"toolbar__icon-button\"]]],false],[0,\"\\n\"]],\"locals\":[]},null],[0,\"    \"],[14],[0,\"\\n\\n\"],[6,[\"main-content\"],null,[[\"class\"],[\"split__panel__bd\"]],{\"statements\":[[0,\"      \"],[1,[26,[\"outlet\"]],false],[0,\"\\n\"]],\"locals\":[]},null],[0,\"  \"],[14],[0,\"\\n\"],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":true}", "meta": { "moduleName": "ember-inspector/templates/-main.hbs" } });
});
define("ember-inspector/templates/application", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "hDUhWj3i", "block": "{\"statements\":[[6,[\"x-app\"],null,[[\"active\",\"isDragging\"],[[28,[\"active\"]],[28,[\"isDragging\"]]]],{\"statements\":[[6,[\"if\"],[[28,[\"emberApplication\"]]],null,{\"statements\":[[0,\"    \"],[11,\"div\",[]],[15,\"class\",\"split\"],[13],[0,\"\\n      \"],[11,\"div\",[]],[15,\"class\",\"split__panel\"],[13],[0,\"\\n        \"],[19,\"main\"],[0,\"\\n      \"],[14],[0,\"\\n\\n\"],[6,[\"if\"],[[28,[\"inspectorExpanded\"]]],null,{\"statements\":[[6,[\"draggable-column\"],null,[[\"side\",\"width\",\"classes\"],[\"right\",[28,[\"inspectorWidth\"]],\"split__panel\"]],{\"statements\":[[0,\"          \"],[1,[33,[\"object-inspector\"],null,[[\"application\",\"model\",\"mixinDetails\",\"toggleInspector\"],[[28,[null]],[28,[\"mixinStack\"]],[28,[\"mixinDetails\"]],\"toggleInspector\"]]],false],[0,\"\\n\"]],\"locals\":[]},null]],\"locals\":[]},null],[0,\"    \"],[14],[0,\"\\n\\n\"]],\"locals\":[]},{\"statements\":[[6,[\"not-detected\"],null,[[\"description\"],[\"Ember application\"]],{\"statements\":[[0,\"    \"],[11,\"li\",[]],[13],[0,\"This is not an Ember application.\"],[14],[0,\"\\n    \"],[11,\"li\",[]],[13],[0,\"You are using an old version of Ember (< rc5).\"],[14],[0,\"\\n\"],[6,[\"if\"],[[28,[\"isChrome\"]]],null,{\"statements\":[[0,\"      \"],[11,\"li\",[]],[13],[0,\"You are using the file:// protocol (instead of http://), in which case:\\n        \"],[11,\"ul\",[]],[13],[0,\"\\n          \"],[11,\"li\",[]],[13],[0,\"Visit the URL: chrome://extensions.\"],[14],[0,\"\\n          \"],[11,\"li\",[]],[13],[0,\"Find the Ember Inspector.\"],[14],[0,\"\\n          \"],[11,\"li\",[]],[13],[0,\"Make sure \\\"Allow access to file URLs\\\" is checked.\"],[14],[0,\"\\n        \"],[14],[0,\"\\n      \"],[14],[0,\"\\n\"]],\"locals\":[]},null]],\"locals\":[]},null]],\"locals\":[]}]],\"locals\":[]},null]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":true}", "meta": { "moduleName": "ember-inspector/templates/application.hbs" } });
});
define("ember-inspector/templates/components/clear-button", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "hTHQWyiN", "block": "{\"statements\":[[11,\"svg\",[]],[15,\"width\",\"16px\"],[15,\"height\",\"16px\"],[15,\"viewBox\",\"0 0 16 16\"],[15,\"version\",\"1.1\"],[15,\"xmlns\",\"http://www.w3.org/2000/svg\",\"http://www.w3.org/2000/xmlns/\"],[15,\"xmlns:xlink\",\"http://www.w3.org/1999/xlink\",\"http://www.w3.org/2000/xmlns/\"],[13],[0,\"\\n  \"],[11,\"g\",[]],[15,\"class\",\"svg-stroke\"],[15,\"transform\",\"translate(3.000000, 3.7500000)\"],[15,\"stroke\",\"#000000\"],[15,\"stroke-width\",\"2\"],[15,\"fill\",\"none\"],[15,\"fill-rule\",\"evenodd\"],[13],[0,\"\\n    \"],[11,\"circle\",[]],[15,\"cx\",\"5.5\"],[15,\"cy\",\"5.5\"],[15,\"r\",\"5.5\"],[13],[14],[0,\"\\n    \"],[11,\"path\",[]],[15,\"d\",\"M1.98253524,1.98253524 L9,9\"],[15,\"id\",\"Line\"],[15,\"stroke-linecap\",\"square\"],[13],[14],[0,\"\\n  \"],[14],[0,\"\\n\"],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/clear-button.hbs" } });
});
define("ember-inspector/templates/components/deprecation-item-source", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "bgkfd0US", "block": "{\"statements\":[[18,\"default\",[[28,[null]]]],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[\"default\"],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/deprecation-item-source.hbs" } });
});
define("ember-inspector/templates/components/deprecation-item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "VpAQno5c", "block": "{\"statements\":[[11,\"tr\",[]],[16,\"class\",[34,[\"list__row \",[33,[\"if\"],[[28,[\"isExpanded\"]],\"list__row_arrow_expanded\",\"list__row_arrow_collapsed\"],null],\" js-deprecation-item\"]]],[5,[\"action\"],[[28,[null]],\"toggleExpand\"]],[13],[0,\"\\n\"],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\",\"title\"],[\"list__cell_main js-deprecation-main-cell\",[28,[\"model\",\"message\"]]]],{\"statements\":[[0,\"    \"],[11,\"div\",[]],[15,\"class\",\"list__cell-arrow\"],[13],[14],[0,\"\\n    \"],[11,\"span\",[]],[15,\"class\",\"pill pill_not-clickable js-deprecation-count\"],[13],[1,[28,[\"model\",\"count\"]],false],[14],[0,\"\\n    \"],[11,\"span\",[]],[15,\"class\",\"js-deprecation-message\"],[13],[1,[28,[\"model\",\"message\"]],false],[14],[0,\"\\n\"],[6,[\"if\"],[[28,[\"model\",\"url\"]]],null,{\"statements\":[[0,\"      \"],[11,\"a\",[]],[16,\"href\",[28,[\"model\",\"url\"]],null],[15,\"class\",\"external-link js-deprecation-url\"],[15,\"target\",\"_blank\"],[15,\"title\",\"Transition Plan\"],[13],[0,\"\\n        Transition Plan\\n      \"],[14],[0,\"\\n\"]],\"locals\":[]},null]],\"locals\":[]},null],[14],[0,\"\\n\"],[6,[\"if\"],[[28,[\"isExpanded\"]]],null,{\"statements\":[[6,[\"if\"],[[28,[\"model\",\"hasSourceMap\"]]],null,{\"statements\":[[6,[\"each\"],[[28,[\"model\",\"sources\"]]],null,{\"statements\":[[6,[\"deprecation-item-source\"],null,[[\"model\"],[[28,[\"single\"]]]],{\"statements\":[[0,\"        \"],[11,\"tr\",[]],[15,\"class\",\"list__row js-deprecation-source\"],[13],[0,\"\\n\"],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\",\"style\"],[\"list__cell_main list__cell_size_larger\",\"padding-left:48px\"]],{\"statements\":[[0,\"            \"],[11,\"span\",[]],[15,\"class\",\"source\"],[13],[0,\"\\n\"],[6,[\"if\"],[[28,[\"source\",\"isClickable\"]]],null,{\"statements\":[[0,\"                \"],[11,\"a\",[]],[15,\"class\",\"js-deprecation-source-link\"],[15,\"href\",\"#\"],[5,[\"action\"],[[28,[null]],[28,[\"openResource\"]],[28,[\"source\",\"model\",\"map\"]]]],[13],[1,[28,[\"source\",\"url\"]],false],[14],[0,\"\\n\"]],\"locals\":[]},{\"statements\":[[0,\"                \"],[11,\"span\",[]],[15,\"class\",\"js-deprecation-source-text\"],[13],[1,[28,[\"source\",\"url\"]],false],[14],[0,\"\\n\"]],\"locals\":[]}],[0,\"            \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],null,{\"statements\":[[0,\"               \\n            \"],[11,\"span\",[]],[15,\"class\",\"send-trace-to-console js-trace-deprecations-btn\"],[15,\"title\",\"Trace deprecations in console\"],[5,[\"action\"],[[28,[null]],[28,[\"traceSource\"]],[28,[\"model\"]],[28,[\"source\",\"model\"]]]],[13],[0,\"\\n              Trace in the console\\n            \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"        \"],[14],[0,\"\\n\"]],\"locals\":[\"source\"]},null]],\"locals\":[\"single\"]},null]],\"locals\":[]},{\"statements\":[[0,\"    \"],[11,\"tr\",[]],[15,\"class\",\"list__row js-deprecation-full-trace\"],[13],[0,\"\\n\"],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\",\"clickable\",\"style\"],[\"list__cell_main\",true,\"padding-left:48px\"]],{\"statements\":[[0,\"        \"],[11,\"div\",[]],[15,\"class\",\"send-trace-to-console js-full-trace-deprecations-btn\"],[15,\"title\",\"Trace deprecations in console\"],[5,[\"action\"],[[28,[null]],[28,[\"traceDeprecations\"]],[28,[\"model\"]]]],[13],[0,\"\\n          Trace in the console\\n        \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"    \"],[14],[0,\"\\n\"]],\"locals\":[]}]],\"locals\":[]},null]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/deprecation-item.hbs" } });
});
define("ember-inspector/templates/components/drag-handle", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "R+QPUEFH", "block": "{\"statements\":[[11,\"div\",[]],[15,\"class\",\"drag-handle__border\"],[13],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/drag-handle.hbs" } });
});
define("ember-inspector/templates/components/draggable-column", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "l9nXzyx9", "block": "{\"statements\":[[6,[\"resizable-column\"],null,[[\"width\",\"class\"],[[28,[\"width\"]],[28,[\"classes\"]]]],{\"statements\":[[0,\"  \"],[18,\"default\"],[0,\"\\n\"]],\"locals\":[]},null],[0,\"\\n\"],[1,[33,[\"drag-handle\"],null,[[\"side\",\"position\",\"minWidth\",\"action\",\"on-drag\"],[[28,[\"side\"]],[28,[\"width\"]],[28,[\"minWidth\"]],\"setIsDragging\",[33,[\"action\"],[[28,[null]],\"didDrag\"],null]]]],false],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[\"default\"],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/draggable-column.hbs" } });
});
define("ember-inspector/templates/components/expandable-render", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "cv5f7jeX", "block": "{\"statements\":[[6,[\"if\"],[[28,[\"node\",\"children\"]]],null,{\"statements\":[[11,\"a\",[]],[15,\"href\",\"#\"],[15,\"class\",\"title\"],[5,[\"action\"],[[28,[null]],\"expand\"]],[13],[0,\"\\n  \"],[11,\"span\",[]],[15,\"class\",\"expander\"],[13],[6,[\"if\"],[[28,[\"expanded\"]]],null,{\"statements\":[[0,\"-\"]],\"locals\":[]},{\"statements\":[[0,\"+\"]],\"locals\":[]}],[14],[0,\"\\n  \"],[1,[33,[\"unbound\"],[[28,[\"node\",\"name\"]]],null],false],[0,\" \"],[11,\"span\",[]],[15,\"class\",\"duration\"],[13],[1,[33,[\"unbound\"],[[28,[\"node\",\"duration\"]]],null],false],[14],[14],[0,\"\\n\"]],\"locals\":[]},{\"statements\":[[0,\"  \"],[11,\"div\",[]],[15,\"class\",\"title\"],[13],[1,[33,[\"unbound\"],[[28,[\"node\",\"name\"]]],null],false],[0,\" \"],[11,\"span\",[]],[15,\"class\",\"duration\"],[13],[1,[33,[\"unbound\"],[[28,[\"node\",\"duration\"]]],null],false],[14],[14],[0,\"\\n\"]],\"locals\":[]}]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/expandable-render.hbs" } });
});
define("ember-inspector/templates/components/iframe-picker", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ji2iFrun", "block": "{\"statements\":[[11,\"div\",[]],[15,\"class\",\"dropdown\"],[13],[0,\"\\n  \"],[11,\"select\",[]],[15,\"class\",\"dropdown__select\"],[16,\"onchange\",[33,[\"action\"],[[28,[null]],\"selectIframe\"],[[\"value\"],[\"target.value\"]]],null],[13],[0,\"\\n\"],[6,[\"each\"],[[28,[\"model\"]]],null,{\"statements\":[[0,\"      \"],[11,\"option\",[]],[16,\"value\",[28,[\"iframe\",\"val\"]],null],[13],[1,[28,[\"iframe\",\"name\"]],false],[14],[0,\"\\n\"]],\"locals\":[\"iframe\"]},null],[0,\"  \"],[14],[0,\"\\n  \"],[11,\"div\",[]],[15,\"class\",\"dropdown__arrow\"],[13],[14],[0,\"\\n\"],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/iframe-picker.hbs" } });
});
define("ember-inspector/templates/components/mixin-detail", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "zy5hszIg", "block": "{\"statements\":[[18,\"default\",[[28,[null]]]],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[\"default\"],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/mixin-detail.hbs" } });
});
define("ember-inspector/templates/components/mixin-details", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "2ir5c2pX", "block": "{\"statements\":[[6,[\"if\"],[[28,[\"model\",\"errors\",\"length\"]]],null,{\"statements\":[[11,\"div\",[]],[15,\"class\",\"mixin mixin_props_no js-object-inspector-errors\"],[13],[0,\"\\n  \"],[11,\"h2\",[]],[15,\"class\",\"mixin__name mixin__name_errors\"],[13],[0,\"\\n    Errors\\n    \"],[11,\"span\",[]],[15,\"class\",\"send-trace-to-console js-send-errors-to-console\"],[5,[\"action\"],[[28,[null]],\"traceErrors\"]],[13],[0,\"\\n      Trace in the console\\n    \"],[14],[0,\"\\n  \"],[14],[0,\"\\n  \"],[11,\"div\",[]],[15,\"class\",\"mixin__properties\"],[13],[0,\"\\n\"],[6,[\"each\"],[[28,[\"model\",\"errors\"]]],null,{\"statements\":[[0,\"    \"],[11,\"div\",[]],[15,\"class\",\"mixin__error js-object-inspector-error\"],[13],[0,\"\\n      Error while computing: \"],[1,[28,[\"error\",\"property\"]],false],[0,\"\\n    \"],[14],[0,\"\\n\"]],\"locals\":[\"error\"]},null],[0,\"  \"],[14],[0,\"\\n\"],[14],[0,\"\\n\"]],\"locals\":[]},null],[6,[\"each\"],[[28,[\"model\",\"mixins\"]]],null,{\"statements\":[[6,[\"mixin-detail\"],null,[[\"model\",\"mixinDetails\"],[[28,[\"item\"]],[28,[null]]]],{\"statements\":[[0,\"    \"],[11,\"div\",[]],[16,\"class\",[34,[\"mixin \",[28,[\"mixin\",\"model\",\"type\"]],\" \",[33,[\"if\"],[[28,[\"mixin\",\"isExpanded\"]],\"mixin_state_expanded\"],null],\" \",[33,[\"if\"],[[28,[\"mixin\",\"model\",\"properties\",\"length\"]],\"mixin_props_yes\",\"mixin_props_no\"],null],\" js-object-detail\"]]],[13],[0,\"\\n\"],[6,[\"if\"],[[28,[\"mixin\",\"model\",\"properties\",\"length\"]]],null,{\"statements\":[[0,\"        \"],[11,\"h2\",[]],[15,\"class\",\"mixin__name js-object-detail-name\"],[5,[\"action\"],[[28,[null]],\"toggleExpanded\"],[[\"target\"],[[28,[\"mixin\"]]]]],[13],[1,[28,[\"mixin\",\"model\",\"name\"]],false],[14],[0,\"\\n\"]],\"locals\":[]},{\"statements\":[[0,\"        \"],[11,\"h2\",[]],[15,\"class\",\"mixin__name js-object-detail-name\"],[13],[1,[28,[\"mixin\",\"model\",\"name\"]],false],[14],[0,\"\\n\"]],\"locals\":[]}],[6,[\"if\"],[[28,[\"mixin\",\"isExpanded\"]]],null,{\"statements\":[[0,\"        \"],[11,\"ul\",[]],[15,\"class\",\"mixin__properties\"],[13],[0,\"\\n\"],[6,[\"each\"],[[28,[\"mixin\",\"model\",\"properties\"]]],null,{\"statements\":[[6,[\"mixin-property\"],null,[[\"model\",\"mixin\"],[[28,[\"prop\"]],[28,[\"mixin\"]]]],{\"statements\":[[0,\"              \"],[11,\"li\",[]],[16,\"class\",[34,[[33,[\"if\"],[[28,[\"property\",\"model\",\"overridden\"]],\"mixin__property_state_overridden\"],null],\" mixin__property js-object-property\"]]],[13],[0,\"\\n\"],[6,[\"if\"],[[28,[\"property\",\"model\",\"value\",\"computed\"]]],null,{\"statements\":[[0,\"                  \"],[11,\"button\",[]],[16,\"class\",[34,[\"mixin__calc-btn \",[33,[\"if\"],[[28,[\"property\",\"isCalculated\"]],\"mixin__calc-btn_calculated\"],null],\" js-calculate\"]]],[5,[\"action\"],[[28,[null]],\"calculate\",[28,[\"property\",\"model\"]]],[[\"bubbles\",\"target\"],[false,[28,[\"mixin\"]]]]],[13],[11,\"img\",[]],[15,\"src\",\"assets/images/calculate.svg\"],[13],[14],[14],[0,\"\\n\"]],\"locals\":[]},{\"statements\":[[0,\"                  \"],[11,\"span\",[]],[15,\"class\",\"pad\"],[13],[14],[0,\"\\n\"]],\"locals\":[]}],[0,\"                \"],[11,\"span\",[]],[15,\"class\",\"mixin__property-name js-object-property-name\"],[13],[1,[28,[\"property\",\"model\",\"name\"]],false],[14],[11,\"span\",[]],[15,\"class\",\"mixin__property-value-separator\"],[13],[0,\": \"],[14],[0,\"\\n\"],[6,[\"unless\"],[[28,[\"property\",\"isEdit\"]]],null,{\"statements\":[[0,\"                  \"],[11,\"span\",[]],[16,\"class\",[34,[[28,[\"property\",\"model\",\"value\",\"type\"]],\" mixin__property-value js-object-property-value\"]]],[5,[\"action\"],[[28,[null]],\"valueClick\",[28,[\"property\",\"model\"]]],[[\"target\"],[[28,[\"property\"]]]]],[13],[1,[28,[\"property\",\"model\",\"value\",\"inspect\"]],false],[14],[0,\"\\n\"]],\"locals\":[]},{\"statements\":[[6,[\"unless\"],[[28,[\"property\",\"isDate\"]]],null,{\"statements\":[[0,\"                    \"],[1,[33,[\"property-field\"],null,[[\"value\",\"finished-editing\",\"save-property\",\"propertyComponent\",\"class\"],[[28,[\"property\",\"txtValue\"]],\"finishedEditing\",\"saveProperty\",[28,[\"property\"]],\"mixin__property-value-txt js-object-property-value-txt\"]]],false],[0,\"\\n\"]],\"locals\":[]},{\"statements\":[[0,\"                    \"],[1,[33,[\"date-property-field\"],null,[[\"value\",\"format\",\"class\",\"onSelection\",\"cancel\"],[[28,[\"property\",\"dateValue\"]],\"YYYY-MM-DD\",\"mixin__property-value-txt js-object-property-value-date\",[33,[\"action\"],[[28,[null]],\"dateSelected\"],[[\"target\"],[[28,[\"property\"]]]]],[33,[\"action\"],[[28,[null]],\"finishedEditing\"],[[\"target\"],[[28,[\"property\"]]]]]]]],false],[0,\"\\n\"]],\"locals\":[]}]],\"locals\":[]}],[0,\"                \"],[11,\"span\",[]],[15,\"class\",\"mixin__property-overridden-by\"],[13],[0,\"(Overridden by \"],[1,[28,[\"property\",\"model\",\"overridden\"]],false],[0,\")\"],[14],[0,\"\\n                \"],[11,\"button\",[]],[15,\"class\",\"mixin__send-btn js-send-to-console-btn\"],[5,[\"action\"],[[28,[null]],\"sendToConsole\",[28,[\"property\",\"model\"]]],[[\"target\"],[[28,[\"mixin\"]]]]],[13],[11,\"img\",[]],[15,\"src\",\"assets/images/send.png\"],[15,\"title\",\"Send to console\"],[13],[14],[14],[0,\"\\n              \"],[14],[0,\"\\n\"]],\"locals\":[\"property\"]},null]],\"locals\":[\"prop\"]},{\"statements\":[[0,\"            \"],[11,\"li\",[]],[15,\"class\",\"mixin__property\"],[13],[0,\"No Properties\"],[14],[0,\"\\n\"]],\"locals\":[]}],[0,\"        \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"    \"],[14],[0,\"\\n\"]],\"locals\":[\"mixin\"]},null]],\"locals\":[\"item\"]},null]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/mixin-details.hbs" } });
});
define("ember-inspector/templates/components/mixin-property", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "T4j4Gqcp", "block": "{\"statements\":[[18,\"default\",[[28,[null]]]],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[\"default\"],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/mixin-property.hbs" } });
});
define("ember-inspector/templates/components/not-detected", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "jdF5NhXy", "block": "{\"statements\":[[11,\"div\",[]],[15,\"class\",\"error-page js-error-page\"],[13],[0,\"\\n\\n  \"],[11,\"div\",[]],[15,\"class\",\"error-page__content\"],[13],[0,\"\\n\\n    \"],[11,\"div\",[]],[15,\"class\",\"error-page__header\"],[13],[0,\"\\n      \"],[11,\"div\",[]],[15,\"class\",\"error-page__title js-error-page-title\"],[13],[1,[26,[\"description\"]],false],[0,\" not detected!\"],[14],[0,\"\\n    \"],[14],[0,\"\\n\\n    \"],[11,\"div\",[]],[15,\"class\",\"error-page__reasons\"],[13],[0,\"\\n\\n      \"],[11,\"div\",[]],[15,\"class\",\"error-page__reasons-title\"],[13],[0,\"\\n\"],[6,[\"if\"],[[28,[\"reasonsTitle\"]]],null,{\"statements\":[[0,\"          \"],[1,[26,[\"reasonsTitle\"]],false],[0,\"\\n\"]],\"locals\":[]},{\"statements\":[[0,\"          Here are some common reasons this happens:\\n\"]],\"locals\":[]}],[0,\"      \"],[14],[0,\"\\n\\n      \"],[11,\"ul\",[]],[15,\"class\",\"error-page__list\"],[13],[0,\"\\n        \"],[18,\"default\"],[0,\"\\n      \"],[14],[0,\"\\n\\n      If you're still having trouble, please file an issue on the Ember Inspector's\\n      \"],[11,\"a\",[]],[15,\"href\",\"https://github.com/emberjs/ember-inspector\"],[15,\"target\",\"_blank\"],[13],[0,\"GitHub page.\"],[14],[0,\"\\n    \"],[14],[0,\"\\n\\n  \"],[14],[0,\"\\n\\n\"],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[\"default\"],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/not-detected.hbs" } });
});
define("ember-inspector/templates/components/object-inspector", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "FuZW+S27", "block": "{\"statements\":[[1,[33,[\"sidebar-toggle\"],null,[[\"action\",\"side\",\"isExpanded\",\"class\"],[\"toggleInspector\",\"right\",true,\"toolbar__icon-button sidebar-toggle--far-left\"]]],false],[0,\"\\n\"],[6,[\"if\"],[[28,[\"model\",\"length\"]]],null,{\"statements\":[[0,\"  \"],[11,\"div\",[]],[15,\"class\",\"split__panel__hd\"],[13],[0,\"\\n    \"],[11,\"div\",[]],[15,\"class\",\"toolbar\"],[13],[0,\"\\n      \"],[11,\"button\",[]],[16,\"class\",[34,[\"toolbar__icon-button \",[33,[\"if\"],[[28,[\"isNested\"]],\"enabled\",\"disabled\"],null],\" js-object-inspector-back\"]]],[5,[\"action\"],[[28,[null]],\"popStack\"]],[13],[0,\"\\n        \"],[11,\"svg\",[]],[15,\"width\",\"9px\"],[15,\"height\",\"9px\"],[15,\"viewBox\",\"0 0 9 9\"],[15,\"version\",\"1.1\"],[15,\"xmlns\",\"http://www.w3.org/2000/svg\",\"http://www.w3.org/2000/xmlns/\"],[15,\"xmlns:xlink\",\"http://www.w3.org/1999/xlink\",\"http://www.w3.org/2000/xmlns/\"],[13],[0,\"\\n          \"],[11,\"g\",[]],[15,\"stroke\",\"none\"],[15,\"stroke-width\",\"1\"],[15,\"fill\",\"none\"],[15,\"fill-rule\",\"evenodd\"],[13],[0,\"\\n            \"],[11,\"polygon\",[]],[15,\"class\",\"svg-fill\"],[15,\"fill\",\"#000000\"],[15,\"transform\",\"translate(4.500000, 4.500000) rotate(-90.000000) translate(-4.500000, -4.500000) \"],[15,\"points\",\"4.5 0 9 9 0 9 \"],[13],[14],[0,\"\\n          \"],[14],[0,\"\\n        \"],[14],[0,\"\\n      \"],[14],[0,\"\\n\\n      \"],[11,\"div\",[]],[15,\"class\",\"divider\"],[13],[14],[0,\"\\n\\n      \"],[11,\"code\",[]],[15,\"class\",\"toolbar__title js-object-name\"],[13],[1,[28,[\"model\",\"firstObject\",\"name\"]],false],[14],[0,\"\\n\\n      \"],[11,\"button\",[]],[15,\"class\",\"send-to-console js-send-object-to-console-btn\"],[5,[\"action\"],[[28,[null]],\"sendObjectToConsole\",[28,[\"model\",\"firstObject\"]]]],[13],[0,\"\\n        \"],[11,\"img\",[]],[15,\"src\",\"assets/images/send.png\"],[15,\"title\",\"Send object to console\"],[13],[14],[0,\"\\n      \"],[14],[0,\"\\n    \"],[14],[0,\"\\n\\n\"],[6,[\"if\"],[[28,[\"trail\"]]],null,{\"statements\":[[0,\"      \"],[11,\"code\",[]],[15,\"class\",\"object-trail js-object-trail\"],[13],[1,[26,[\"trail\"]],false],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"  \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"\\n\"],[11,\"div\",[]],[15,\"class\",\"split__panel__bd\"],[13],[0,\"\\n  \"],[1,[33,[\"mixin-details\"],null,[[\"model\"],[[28,[\"mixinDetails\"]]]]],false],[0,\"\\n\"],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/object-inspector.hbs" } });
});
define("ember-inspector/templates/components/promise-item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "LSP7ZqtY", "block": "{\"statements\":[[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\",\"style\",\"on-click\"],[[33,[\"concat\"],[\"list__cell_main \",[28,[\"expandedClass\"]]],null],[28,[\"labelStyle\"]],[33,[\"action\"],[[28,[null]],[28,[\"toggleExpand\"]],[28,[\"model\"]]],null]]],{\"statements\":[[0,\"  \"],[11,\"div\",[]],[15,\"class\",\"list__cell-partial list__cell-partial_size_medium\"],[13],[0,\"\\n    \"],[11,\"span\",[]],[16,\"title\",[34,[[26,[\"label\"]]]]],[15,\"class\",\"js-promise-label\"],[13],[0,\"\\n      \"],[11,\"span\",[]],[15,\"class\",\"list__cell-arrow\"],[13],[14],[0,\" \"],[1,[26,[\"label\"]],false],[0,\"\\n    \"],[14],[0,\"\\n  \"],[14],[0,\"\\n  \"],[11,\"div\",[]],[15,\"class\",\"list__cell-helper\"],[13],[0,\"\\n\"],[6,[\"if\"],[[28,[\"model\",\"hasStack\"]]],null,{\"statements\":[[0,\"      \"],[11,\"div\",[]],[15,\"class\",\"send-trace-to-console js-trace-promise-btn\"],[15,\"title\",\"Trace promise in console\"],[5,[\"action\"],[[28,[null]],[28,[\"tracePromise\"]],[28,[\"model\"]]]],[13],[0,\"\\n        Trace\\n      \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"  \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],null,{\"statements\":[[0,\"  \"],[11,\"div\",[]],[15,\"class\",\"pill pill_text_clear js-promise-state\"],[16,\"style\",[26,[\"style\"]],null],[13],[1,[26,[\"state\"]],false],[14],[0,\"\\n\"]],\"locals\":[]},null],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\"],[\"js-promise-value\"]],{\"statements\":[[6,[\"if\"],[[28,[\"hasValue\"]]],null,{\"statements\":[[0,\"    \"],[11,\"div\",[]],[15,\"class\",\"list__cell-partial list__cell-partial_size_medium\"],[16,\"title\",[34,[[28,[\"settledValue\",\"inspect\"]]]]],[13],[0,\"\\n\"],[6,[\"if\"],[[28,[\"isValueInspectable\"]]],null,{\"statements\":[[0,\"        \"],[11,\"span\",[]],[15,\"class\",\"list__link js-promise-object-value\"],[5,[\"action\"],[[28,[null]],[28,[\"inspectObject\"]],[28,[\"settledValue\",\"objectId\"]]]],[13],[1,[28,[\"settledValue\",\"inspect\"]],false],[14],[0,\"\\n\"]],\"locals\":[]},{\"statements\":[[0,\"        \"],[1,[28,[\"settledValue\",\"inspect\"]],false],[0,\"\\n\"]],\"locals\":[]}],[0,\"    \"],[14],[0,\"\\n    \"],[11,\"div\",[]],[15,\"class\",\"list__cell-helper\"],[13],[0,\"\\n\"],[6,[\"if\"],[[28,[\"isError\"]]],null,{\"statements\":[[0,\"        \"],[11,\"div\",[]],[15,\"class\",\"send-trace-to-console js-send-to-console-btn\"],[15,\"title\",\"Send stack trace to the console\"],[5,[\"action\"],[[28,[null]],[28,[\"sendValueToConsole\"]],[28,[\"model\"]]]],[13],[0,\"\\n          Stack trace\\n        \"],[14],[0,\"\\n\"]],\"locals\":[]},{\"statements\":[[0,\"        \"],[1,[33,[\"send-to-console\"],null,[[\"action\",\"param\"],[[28,[\"sendValueToConsole\"]],[28,[\"model\"]]]]],false],[0,\"\\n\"]],\"locals\":[]}],[0,\"    \"],[14],[0,\"\\n\"]],\"locals\":[]},{\"statements\":[[0,\"  --\\n\"]],\"locals\":[]}]],\"locals\":[]},null],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\"],[\"list__cell list__cell_value_numeric js-promise-time\"]],{\"statements\":[[0,\"  \"],[1,[33,[\"ms-to-time\"],[[28,[\"timeToSettle\"]]],null],false],[0,\"\\n\"]],\"locals\":[]},null]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/promise-item.hbs" } });
});
define("ember-inspector/templates/components/property-field", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "wRcuo7zY", "block": "{\"statements\":[],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/property-field.hbs" } });
});
define("ember-inspector/templates/components/record-filter", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "dZmUyz3d", "block": "{\"statements\":[[18,\"default\",[[28,[null]]]],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[\"default\"],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/record-filter.hbs" } });
});
define("ember-inspector/templates/components/record-item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "LNqbreqW", "block": "{\"statements\":[[6,[\"each\"],[[28,[\"columns\"]]],null,{\"statements\":[[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\",\"clickable\",\"style\"],[\"js-record-column\",true,[28,[\"style\"]]]],{\"statements\":[[0,\"    \"],[1,[28,[\"column\",\"value\"]],false],[0,\"\\n\"]],\"locals\":[]},null]],\"locals\":[\"column\"]},null]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/record-item.hbs" } });
});
define("ember-inspector/templates/components/reload-button", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Du+dYWi4", "block": "{\"statements\":[[11,\"svg\",[]],[15,\"version\",\"1.1\"],[15,\"xmlns\",\"http://www.w3.org/2000/svg\",\"http://www.w3.org/2000/xmlns/\"],[15,\"xmlns:xlink\",\"http://www.w3.org/1999/xlink\",\"http://www.w3.org/2000/xmlns/\"],[15,\"x\",\"0px\"],[15,\"y\",\"0px\"],[15,\"width\",\"14px\"],[15,\"height\",\"14px\"],[15,\"viewBox\",\"0 0 54.203 55.142\"],[15,\"enable-background\",\"new 0 0 54.203 55.142\"],[15,\"xml:space\",\"preserve\",\"http://www.w3.org/XML/1998/namespace\"],[13],[0,\"\\n\"],[11,\"path\",[]],[15,\"fill\",\"#797979\"],[15,\"d\",\"M54.203,21.472l-0.101-1.042h0.101c-0.042-0.159-0.101-0.311-0.146-0.468l-1.82-18.786l-6.056,6.055\\n  C41.277,2.741,34.745,0,27.571,0C12.344,0,0,12.344,0,27.571s12.344,27.571,27.571,27.571c12.757,0,23.485-8.666,26.632-20.431\\n  h-8.512c-2.851,7.228-9.881,12.349-18.12,12.349c-10.764,0-19.49-8.726-19.49-19.489s8.727-19.489,19.49-19.489\\n  c4.942,0,9.441,1.853,12.873,4.887l-6.536,6.536L54.203,21.472z\"],[13],[14],[0,\"\\n\"],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/reload-button.hbs" } });
});
define("ember-inspector/templates/components/render-item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "nkFNAc8I", "block": "{\"statements\":[[11,\"tr\",[]],[16,\"style\",[26,[\"nodeStyle\"]],null],[15,\"class\",\"list__row js-render-profile-item\"],[13],[0,\"\\n\"],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\",\"on-click\",\"style\"],[[33,[\"concat\"],[\"list__cell_main \",[28,[\"expandedClass\"]],\" js-render-main-cell\"],null],[33,[\"action\"],[[28,[null]],\"toggleExpand\"],null],[28,[\"nameStyle\"]]]],{\"statements\":[[0,\"    \"],[11,\"span\",[]],[15,\"class\",\"list__cell-arrow\"],[13],[14],[0,\"\\n    \"],[11,\"span\",[]],[16,\"title\",[34,[[28,[\"model\",\"name\"]]]]],[13],[0,\"\\n      \"],[11,\"span\",[]],[15,\"class\",\"js-render-profile-name\"],[13],[1,[28,[\"model\",\"name\"]],false],[14],[0,\"\\n    \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\"],[\"list__cell_value_numeric\"]],{\"statements\":[[0,\"    \"],[11,\"span\",[]],[15,\"class\",\"pill pill_not-clickable js-render-profile-duration\"],[13],[1,[33,[\"ms-to-time\"],[[28,[\"model\",\"duration\"]]],null],false],[14],[0,\"\\n\"]],\"locals\":[]},null],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\"],[\"list__cell_value_numeric js-render-profile-timestamp\"]],{\"statements\":[[0,\"    \"],[1,[26,[\"readableTime\"]],false],[0,\"\\n\"]],\"locals\":[]},null],[14],[0,\"\\n\"],[6,[\"if\"],[[28,[\"isExpanded\"]]],null,{\"statements\":[[6,[\"each\"],[[28,[\"model\",\"children\"]]],null,{\"statements\":[[0,\"    \"],[1,[33,[\"render-item\"],null,[[\"model\",\"target\",\"list\"],[[28,[\"child\"]],[28,[null]],[28,[\"list\"]]]]],false],[0,\"\\n\"]],\"locals\":[\"child\"]},null]],\"locals\":[]},null]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/render-item.hbs" } });
});
define("ember-inspector/templates/components/route-item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "GscjzGv5", "block": "{\"statements\":[[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\",\"highlight\"],[\"list__cell_main js-route-name\",[28,[\"isCurrent\"]]]],{\"statements\":[[0,\"  \"],[11,\"div\",[]],[16,\"style\",[26,[\"labelStyle\"]],null],[13],[0,\"\\n    \"],[11,\"span\",[]],[16,\"title\",[28,[\"model\",\"value\",\"name\"]],null],[15,\"class\",\"js-view-name\"],[13],[1,[28,[\"model\",\"value\",\"name\"]],false],[14],[0,\"\\n  \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],null,{\"statements\":[[0,\"  \"],[11,\"div\",[]],[15,\"class\",\"list__cell-partial list__cell-partial_clickable js-route-handler\"],[5,[\"action\"],[[28,[null]],[28,[\"inspectRoute\"]],[28,[\"model\",\"value\",\"routeHandler\",\"name\"]]]],[13],[0,\"\\n    \"],[11,\"span\",[]],[16,\"title\",[34,[[28,[\"model\",\"value\",\"routeHandler\",\"className\"]]]]],[13],[1,[28,[\"model\",\"value\",\"routeHandler\",\"className\"]],false],[14],[0,\"\\n  \"],[14],[0,\"\\n  \"],[11,\"div\",[]],[15,\"class\",\"list__cell-helper\"],[13],[0,\"\\n    \"],[1,[33,[\"send-to-console\"],null,[[\"action\",\"param\"],[[28,[\"sendRouteHandlerToConsole\"]],[28,[\"model\",\"value\",\"routeHandler\",\"name\"]]]]],false],[0,\"\\n  \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],null,{\"statements\":[[6,[\"if\"],[[28,[\"model\",\"value\",\"controller\",\"exists\"]]],null,{\"statements\":[[0,\"    \"],[11,\"div\",[]],[15,\"class\",\"list__cell-partial list__cell-partial_clickable js-route-controller\"],[5,[\"action\"],[[28,[null]],[28,[\"inspectController\"]],[28,[\"model\",\"value\",\"controller\"]]]],[13],[0,\"\\n      \"],[11,\"span\",[]],[16,\"title\",[28,[\"model\",\"value\",\"controller\",\"className\"]],null],[13],[1,[28,[\"model\",\"value\",\"controller\",\"className\"]],false],[14],[0,\"\\n    \"],[14],[0,\"\\n    \"],[11,\"div\",[]],[15,\"class\",\"list__cell-helper\"],[13],[0,\"\\n      \"],[1,[33,[\"send-to-console\"],null,[[\"action\",\"param\"],[[28,[\"sendControllerToConsole\"]],[28,[\"model\",\"value\",\"controller\",\"name\"]]]]],false],[0,\"\\n    \"],[14],[0,\"\\n\\n\"]],\"locals\":[]},{\"statements\":[[0,\"    \"],[11,\"div\",[]],[15,\"class\",\"js-route-controller\"],[13],[0,\"\\n      \"],[11,\"span\",[]],[16,\"title\",[28,[\"model\",\"value\",\"controller\",\"className\"]],null],[13],[1,[28,[\"model\",\"value\",\"controller\",\"className\"]],false],[14],[0,\"\\n    \"],[14],[0,\"\\n\"]],\"locals\":[]}]],\"locals\":[]},null],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\"],[\"js-route-template\"]],{\"statements\":[[0,\"  \"],[11,\"span\",[]],[16,\"title\",[28,[\"model\",\"value\",\"template\",\"name\"]],null],[13],[1,[28,[\"model\",\"value\",\"template\",\"name\"]],false],[14],[0,\"\\n\"]],\"locals\":[]},null],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\"],[\"js-route-url\"]],{\"statements\":[[0,\"  \"],[11,\"span\",[]],[16,\"title\",[28,[\"model\",\"value\",\"url\"]],null],[13],[1,[28,[\"model\",\"value\",\"url\"]],false],[14],[0,\"\\n\"]],\"locals\":[]},null]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/route-item.hbs" } });
});
define("ember-inspector/templates/components/send-to-console", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "aOK6GtX3", "block": "{\"statements\":[[11,\"img\",[]],[15,\"src\",\"assets/images/send.png\"],[15,\"title\",\"Send to console\"],[13],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/send-to-console.hbs" } });
});
define("ember-inspector/templates/components/sidebar-toggle", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "rFKjU/8B", "block": "{\"statements\":[[6,[\"if\"],[[28,[\"isRight\"]]],null,{\"statements\":[[6,[\"if\"],[[28,[\"isExpanded\"]]],null,{\"statements\":[[0,\"    \"],[11,\"svg\",[]],[15,\"width\",\"16px\"],[15,\"height\",\"14px\"],[15,\"viewBox\",\"0 0 16 14\"],[15,\"version\",\"1.1\"],[15,\"xmlns\",\"http://www.w3.org/2000/svg\",\"http://www.w3.org/2000/xmlns/\"],[15,\"xmlns:xlink\",\"http://www.w3.org/1999/xlink\",\"http://www.w3.org/2000/xmlns/\"],[13],[0,\"\\n      \"],[11,\"title\",[]],[13],[0,\"Collapse Right Sidebar\"],[14],[0,\"\\n      \"],[11,\"g\",[]],[15,\"id\",\"expand-sidebar-left\"],[15,\"stroke\",\"none\"],[15,\"fill\",\"none\"],[15,\"transform\",\"translate(0,1)\"],[13],[0,\"\\n        \"],[11,\"rect\",[]],[15,\"class\",\"svg-stroke\"],[15,\"stroke\",\"#000000\"],[15,\"x\",\"0.5\"],[15,\"y\",\"0.5\"],[15,\"width\",\"14\"],[15,\"height\",\"12\"],[13],[14],[0,\"\\n        \"],[11,\"path\",[]],[15,\"class\",\"svg-stroke\"],[15,\"shape-rendering\",\"crispEdges\"],[15,\"d\",\"M10.75,0 L10.75,12\"],[15,\"stroke\",\"#000000\"],[13],[14],[0,\"\\n        \"],[11,\"path\",[]],[15,\"class\",\"svg-fill\"],[15,\"d\",\"M6.25,4 L9.25,9.5 L3.25,9.5 L6.25,4 Z\"],[15,\"fill\",\"#000\"],[15,\"transform\",\"translate(6.250000, 6.500000) scale(-1, 1) rotate(-90.000000) translate(-6.250000, -6.500000) \"],[13],[14],[0,\"\\n      \"],[14],[0,\"\\n    \"],[14],[0,\"\\n\"]],\"locals\":[]},{\"statements\":[[0,\"    \"],[11,\"svg\",[]],[15,\"width\",\"16px\"],[15,\"height\",\"14px\"],[15,\"viewBox\",\"0 0 16 14\"],[15,\"version\",\"1.1\"],[15,\"xmlns\",\"http://www.w3.org/2000/svg\",\"http://www.w3.org/2000/xmlns/\"],[15,\"xmlns:xlink\",\"http://www.w3.org/1999/xlink\",\"http://www.w3.org/2000/xmlns/\"],[13],[0,\"\\n      \"],[11,\"title\",[]],[13],[0,\"Expand Right Sidebar\"],[14],[0,\"\\n      \"],[11,\"g\",[]],[15,\"id\",\"expand-sidebar-left\"],[15,\"stroke\",\"none\"],[15,\"fill\",\"none\"],[15,\"transform\",\"translate(0,1)\"],[13],[0,\"\\n        \"],[11,\"rect\",[]],[15,\"class\",\"svg-stroke\"],[15,\"stroke\",\"#000000\"],[15,\"x\",\"0.5\"],[15,\"y\",\"0.5\"],[15,\"width\",\"14\"],[15,\"height\",\"12\"],[13],[14],[0,\"\\n        \"],[11,\"path\",[]],[15,\"class\",\"svg-stroke\"],[15,\"shape-rendering\",\"crispEdges\"],[15,\"d\",\"M10.75,0 L10.75,12\"],[15,\"stroke\",\"#000000\"],[13],[14],[0,\"\\n        \"],[11,\"path\",[]],[15,\"class\",\"svg-fill\"],[15,\"d\",\"M5.25,4 L8.25,9.25 L2.25,9.25 L5.25,4 L5.25,4 Z\"],[15,\"fill\",\"#000000\"],[15,\"transform\",\"translate(5.250000, 6.500000) rotate(-90.000000) translate(-5.250000, -6.500000)\"],[13],[14],[0,\"\\n      \"],[14],[0,\"\\n    \"],[14],[0,\"\\n\"]],\"locals\":[]}]],\"locals\":[]},{\"statements\":[[6,[\"if\"],[[28,[\"isExpanded\"]]],null,{\"statements\":[[0,\"    \"],[11,\"svg\",[]],[15,\"width\",\"16px\"],[15,\"height\",\"14px\"],[15,\"viewBox\",\"0 0 16 14\"],[15,\"version\",\"1.1\"],[15,\"xmlns\",\"http://www.w3.org/2000/svg\",\"http://www.w3.org/2000/xmlns/\"],[15,\"xmlns:xlink\",\"http://www.w3.org/1999/xlink\",\"http://www.w3.org/2000/xmlns/\"],[13],[0,\"\\n      \"],[11,\"title\",[]],[13],[0,\"Collapse Left Sidebar\"],[14],[0,\"\\n      \"],[11,\"g\",[]],[15,\"id\",\"expand-sidebar-left\"],[15,\"stroke\",\"none\"],[15,\"fill\",\"none\"],[15,\"transform\",\"translate(8.000000, 8.000000) scale(-1, 1) translate(-8.000000, -7.000000)\"],[13],[0,\"\\n        \"],[11,\"rect\",[]],[15,\"class\",\"svg-stroke\"],[15,\"stroke\",\"#000000\"],[15,\"x\",\"0.5\"],[15,\"y\",\"0.5\"],[15,\"width\",\"14\"],[15,\"height\",\"12\"],[13],[14],[0,\"\\n        \"],[11,\"path\",[]],[15,\"class\",\"svg-stroke\"],[15,\"shape-rendering\",\"crispEdges\"],[15,\"d\",\"M10.5,0 L10.5,12\"],[15,\"stroke\",\"#000000\"],[13],[14],[0,\"\\n        \"],[11,\"path\",[]],[15,\"class\",\"svg-fill\"],[15,\"d\",\"M6.25,4 L9.25,9.5 L3.25,9.5 L6.25,4 Z\"],[15,\"fill\",\"#000\"],[15,\"transform\",\"translate(6.250000, 6.500000) scale(-1, 1) rotate(-90.000000) translate(-6.250000, -6.500000) \"],[13],[14],[0,\"\\n      \"],[14],[0,\"\\n    \"],[14],[0,\"\\n\"]],\"locals\":[]},{\"statements\":[[0,\"    \"],[11,\"svg\",[]],[15,\"width\",\"16px\"],[15,\"height\",\"14px\"],[15,\"viewBox\",\"0 0 16 14\"],[15,\"version\",\"1.1\"],[15,\"xmlns\",\"http://www.w3.org/2000/svg\",\"http://www.w3.org/2000/xmlns/\"],[15,\"xmlns:xlink\",\"http://www.w3.org/1999/xlink\",\"http://www.w3.org/2000/xmlns/\"],[13],[0,\"\\n      \"],[11,\"title\",[]],[13],[0,\"Expand Left Sidebar\"],[14],[0,\"\\n      \"],[11,\"g\",[]],[15,\"id\",\"expand-sidebar-left\"],[15,\"stroke\",\"none\"],[15,\"fill\",\"none\"],[15,\"transform\",\"translate(8.000000, 8.000000) scale(-1, 1) translate(-8.000000, -7.000000)\"],[13],[0,\"\\n        \"],[11,\"rect\",[]],[15,\"class\",\"svg-stroke\"],[15,\"stroke\",\"#000000\"],[15,\"x\",\"0.5\"],[15,\"y\",\"0.5\"],[15,\"width\",\"14\"],[15,\"height\",\"12\"],[13],[14],[0,\"\\n        \"],[11,\"path\",[]],[15,\"class\",\"svg-stroke\"],[15,\"shape-rendering\",\"crispEdges\"],[15,\"d\",\"M10.5,0 L10.5,12\"],[15,\"stroke\",\"#000000\"],[13],[14],[0,\"\\n        \"],[11,\"path\",[]],[15,\"class\",\"svg-fill\"],[15,\"d\",\"M5.25,4 L8.25,9.25 L2.25,9.25 L5.25,4 L5.25,4 Z\"],[15,\"fill\",\"#000000\"],[15,\"transform\",\"translate(5.250000, 6.500000) rotate(-90.000000) translate(-5.250000, -6.500000)\"],[13],[14],[0,\"\\n      \"],[14],[0,\"\\n    \"],[14],[0,\"\\n\"]],\"locals\":[]}]],\"locals\":[]}]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/sidebar-toggle.hbs" } });
});
define("ember-inspector/templates/components/view-item", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "DY5OwQYo", "block": "{\"statements\":[[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\"],[\"list__cell_main\"]],{\"statements\":[[0,\"  \"],[11,\"div\",[]],[16,\"style\",[26,[\"labelStyle\"]],null],[13],[0,\"\\n    \"],[11,\"span\",[]],[16,\"title\",[34,[[28,[\"model\",\"value\",\"name\"]]]]],[15,\"class\",\"js-view-name\"],[13],[1,[28,[\"model\",\"value\",\"name\"]],false],[14],[0,\"\\n  \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\",\"clickable\",\"on-click\"],[\"js-view-template\",[28,[\"hasElement\"]],[33,[\"action\"],[[28,[null]],\"inspectElement\"],null]]],{\"statements\":[[0,\"  \"],[11,\"span\",[]],[16,\"title\",[34,[[28,[\"model\",\"value\",\"template\"]]]]],[13],[1,[33,[\"if\"],[[28,[\"hasTemplate\"]],[28,[\"model\",\"value\",\"template\"]],\"--\"],null],false],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"\\n\"],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\"],[\"js-view-model\"]],{\"statements\":[[6,[\"if\"],[[28,[\"hasModel\"]]],null,{\"statements\":[[0,\"    \"],[11,\"div\",[]],[16,\"class\",[34,[\"list__cell-partial \",[33,[\"if\"],[[28,[\"modelInspectable\"]],\"list__cell-partial_clickable\"],null],\" js-view-model-clickable\"]]],[5,[\"action\"],[[28,[null]],\"inspectModel\",[28,[\"model\",\"value\",\"model\",\"objectId\"]]]],[13],[0,\"\\n      \"],[11,\"span\",[]],[16,\"title\",[34,[[28,[\"model\",\"value\",\"model\",\"completeName\"]]]]],[13],[1,[28,[\"model\",\"value\",\"model\",\"name\"]],false],[14],[0,\"\\n    \"],[14],[0,\"\\n    \"],[11,\"div\",[]],[15,\"class\",\"list__cell-helper\"],[13],[0,\"\\n      \"],[1,[33,[\"send-to-console\"],null,[[\"action\",\"param\"],[[28,[\"sendModelToConsole\"]],[28,[\"model\",\"value\"]]]]],false],[0,\"\\n    \"],[14],[0,\"\\n\"]],\"locals\":[]},{\"statements\":[[0,\"    --\\n\"]],\"locals\":[]}]],\"locals\":[]},null],[0,\"\\n\"],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\"],[\"js-view-controller\"]],{\"statements\":[[6,[\"if\"],[[28,[\"hasController\"]]],null,{\"statements\":[[0,\"    \"],[11,\"div\",[]],[16,\"class\",[34,[\"list__cell-partial \",[33,[\"if\"],[[28,[\"hasController\"]],\"list__cell-partial_clickable\"],null]]]],[5,[\"action\"],[[28,[null]],[28,[\"inspect\"]],[28,[\"model\",\"value\",\"controller\",\"objectId\"]]]],[13],[0,\"\\n      \"],[11,\"span\",[]],[16,\"title\",[34,[[28,[\"model\",\"value\",\"controller\",\"completeName\"]]]]],[13],[1,[28,[\"model\",\"value\",\"controller\",\"name\"]],false],[14],[0,\"\\n    \"],[14],[0,\"\\n    \"],[11,\"div\",[]],[15,\"class\",\"list__cell-helper\"],[13],[0,\"\\n      \"],[1,[33,[\"send-to-console\"],null,[[\"action\",\"param\"],[[28,[\"sendObjectToConsole\"]],[28,[\"model\",\"value\",\"controller\",\"objectId\"]]]]],false],[0,\"\\n    \"],[14],[0,\"\\n\"]],\"locals\":[]},null]],\"locals\":[]},null],[0,\"\\n\"],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\"],[\"js-view-class\"]],{\"statements\":[[6,[\"if\"],[[28,[\"hasView\"]]],null,{\"statements\":[[0,\"    \"],[11,\"div\",[]],[16,\"class\",[34,[\"list__cell-partial \",[33,[\"if\"],[[28,[\"hasView\"]],\"list__cell-partial_clickable\"],null]]]],[5,[\"action\"],[[28,[null]],\"inspectView\"]],[13],[0,\"\\n      \"],[11,\"span\",[]],[16,\"title\",[34,[[28,[\"model\",\"value\",\"completeViewClass\"]]]]],[13],[1,[28,[\"model\",\"value\",\"viewClass\"]],false],[14],[0,\"\\n    \"],[14],[0,\"\\n    \"],[11,\"div\",[]],[15,\"class\",\"list__cell-helper\"],[13],[0,\"\\n      \"],[1,[33,[\"send-to-console\"],null,[[\"action\",\"param\"],[[28,[\"sendObjectToConsole\"]],[28,[\"model\",\"value\",\"objectId\"]]]]],false],[0,\"\\n    \"],[14],[0,\"\\n\"]],\"locals\":[]},{\"statements\":[[0,\"    --\\n\"]],\"locals\":[]}]],\"locals\":[]},null],[0,\"\\n\"],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\"],[\"list__cell_size_small list__cell_value_numeric\"]],{\"statements\":[[0,\"  \"],[11,\"span\",[]],[15,\"class\",\"pill pill_not-clickable pill_size_small js-view-duration\"],[13],[1,[33,[\"ms-to-time\"],[[28,[\"model\",\"value\",\"duration\"]]],null],false],[14],[0,\"\\n\"]],\"locals\":[]},null]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/view-item.hbs" } });
});
define("ember-inspector/templates/components/warning-message", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "GU4E0I0C", "block": "{\"statements\":[[11,\"div\",[]],[15,\"class\",\"warning\"],[13],[0,\"\\n    \"],[11,\"img\",[]],[15,\"class\",\"warning__image\"],[15,\"src\",\"assets/images/warning.png\"],[15,\"alt\",\"warning icon\"],[13],[14],[0,\"\\n    \"],[11,\"p\",[]],[15,\"class\",\"warning__text\"],[13],[0,\"Render times may be inaccurate due to instrumentation and environment\"],[14],[0,\"\\n    \"],[11,\"button\",[]],[15,\"class\",\"warning__close\"],[5,[\"action\"],[[28,[null]],[28,[\"close\"]]]],[13],[0,\" hide \"],[14],[0,\"\\n\"],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/warning-message.hbs" } });
});
define("ember-inspector/templates/components/x-list-cell", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "/QcQimAt", "block": "{\"statements\":[[18,\"default\"],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[\"default\"],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/x-list-cell.hbs" } });
});
define("ember-inspector/templates/components/x-list-content", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "uL+etHsw", "block": "{\"statements\":[[11,\"div\",[]],[15,\"class\",\"list__table-container\"],[13],[0,\"\\n  \"],[11,\"table\",[]],[13],[0,\"\\n    \"],[11,\"colgroup\",[]],[13],[0,\"\\n\"],[6,[\"each\"],[[28,[\"columns\"]]],null,{\"statements\":[[0,\"        \"],[11,\"col\",[]],[16,\"style\",[33,[\"build-style\"],null,[[\"width\"],[[33,[\"concat\"],[[28,[\"column\",\"width\"]],\"px\"],null]]]],null],[13],[14],[0,\"\\n\"]],\"locals\":[\"column\"]},null],[0,\"    \"],[14],[0,\"\\n    \"],[18,\"default\",[[33,[\"hash\"],null,[[\"rowEvents\"],[[28,[\"rowEvents\"]]]]]]],[0,\"\\n  \"],[14],[0,\"\\n\"],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[\"default\"],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/x-list-content.hbs" } });
});
define("ember-inspector/templates/components/x-list", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "t9xSaLQG", "block": "{\"statements\":[[6,[\"if\"],[[28,[\"schema\",\"columns\",\"length\"]]],null,{\"statements\":[[0,\"  \"],[11,\"div\",[]],[15,\"class\",\"list__header\"],[13],[0,\"\\n    \"],[11,\"div\",[]],[15,\"class\",\"list__table-container\"],[13],[0,\"\\n      \"],[11,\"table\",[]],[13],[0,\"\\n        \"],[11,\"colgroup\",[]],[13],[0,\"\\n\"],[6,[\"each\"],[[28,[\"columns\"]]],[[\"key\"],[\"id\"]],{\"statements\":[[0,\"            \"],[11,\"col\",[]],[16,\"style\",[33,[\"build-style\"],null,[[\"width\"],[[33,[\"concat\"],[[28,[\"column\",\"width\"]],\"px\"],null]]]],null],[13],[14],[0,\"\\n\"]],\"locals\":[\"column\"]},null],[0,\"        \"],[14],[0,\"\\n        \"],[11,\"tbody\",[]],[13],[0,\"\\n          \"],[11,\"tr\",[]],[15,\"class\",\"list__row\"],[13],[0,\"\\n\"],[6,[\"each\"],[[28,[\"columns\"]]],[[\"key\"],[\"id\"]],{\"statements\":[[0,\"              \"],[6,[\"x-list-cell\"],null,[[\"tagName\",\"class\"],[\"th\",\"js-header-column\"]],{\"statements\":[[1,[28,[\"column\",\"name\"]],false]],\"locals\":[]},null],[0,\"\\n\"]],\"locals\":[\"column\"]},null],[0,\"          \"],[14],[0,\"\\n        \"],[14],[0,\"\\n      \"],[14],[0,\"\\n    \"],[14],[0,\"\\n  \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"\\n\"],[6,[\"x-list-content\"],null,[[\"headerHeight\",\"columns\"],[[28,[\"headerHeight\"]],[28,[\"columns\"]]]],{\"statements\":[[0,\"  \"],[18,\"default\",[[33,[\"hash\"],null,[[\"cell\",\"vertical-collection\",\"rowEvents\"],[[33,[\"component\"],[\"x-list-cell\"],[[\"tagName\"],[\"td\"]]],[33,[\"component\"],[\"vertical-collection\"],[[\"defaultHeight\",\"tagName\",\"itemClassNames\",\"containerSelector\"],[30,\"tbody\",[33,[\"concat\"],[\"list__row js-\",[28,[\"name\"]],\"-item \",[28,[\"itemClass\"]]],null],\".js-list-content\"]]],[28,[\"content\",\"rowEvents\"]]]]]]],[0,\"\\n\"]],\"locals\":[\"content\"]},null],[0,\"\\n\"],[6,[\"each\"],[[28,[\"columns\"]]],[[\"key\"],[\"id\"]],{\"statements\":[[6,[\"unless\"],[[33,[\"eq\"],[[28,[\"column\"]],[28,[\"columns\",\"lastObject\"]]],null]],null,{\"statements\":[[0,\"    \"],[1,[33,[\"drag-handle\"],null,[[\"side\",\"left\",\"position\",\"minWidth\",\"maxWidth\",\"on-drag\",\"faded\"],[\"left\",[28,[\"column\",\"left\"]],[33,[\"one-way\"],[[28,[\"column\",\"width\"]]],null],[28,[\"minWidth\"]],[28,[\"column\",\"maxWidth\"]],[33,[\"action\"],[[28,[null]],\"didResize\",[28,[\"column\",\"id\"]]],null],true]]],false],[0,\"\\n\"]],\"locals\":[]},null]],\"locals\":[\"column\"]},null]],\"locals\":[],\"named\":[],\"yields\":[\"default\"],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/components/x-list.hbs" } });
});
define("ember-inspector/templates/container-type-toolbar", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "TbLnEFgX", "block": "{\"statements\":[[11,\"div\",[]],[15,\"class\",\"toolbar\"],[13],[0,\"\\n  \"],[1,[33,[\"reload-button\"],null,[[\"action\",\"classNames\"],[\"reload\",\"toolbar__icon-button js-reload-container-btn\"]]],false],[0,\"\\n\\n  \"],[11,\"div\",[]],[15,\"class\",\"toolbar__search toolbar__search--small js-container-instance-search\"],[13],[0,\"\\n    \"],[1,[33,[\"input\"],null,[[\"value\",\"placeholder\"],[[28,[\"searchVal\"]],\"Search\"]]],false],[0,\"\\n  \"],[14],[0,\"\\n\"],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/container-type-toolbar.hbs" } });
});
define("ember-inspector/templates/container-type", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "qcKL6HQK", "block": "{\"statements\":[[6,[\"x-list\"],null,[[\"name\",\"schema\",\"headerHeight\"],[\"container-instance-list\",[33,[\"hash\"],null,[[\"columns\"],[null]]],0]],{\"statements\":[[6,[\"component\"],[[28,[\"list\",\"vertical-collection\"]]],[[\"content\",\"defaultHeight\",\"itemClass\"],[[28,[\"filtered\"]],30,\"js-instance-row\"]],{\"statements\":[[6,[\"container-instance\"],null,[[\"list\",\"index\",\"on-click\"],[[28,[\"list\"]],[28,[\"index\"]],[33,[\"action\"],[[28,[null]],\"inspectInstance\",[28,[\"content\"]]],null]]],{\"statements\":[[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\",\"clickable\"],[\"list__cell_main\",[28,[\"content\",\"inspectable\"]]]],{\"statements\":[[0,\"        \"],[1,[28,[\"content\",\"name\"]],false],[0,\"\\n\"]],\"locals\":[]},null]],\"locals\":[]},null]],\"locals\":[\"content\",\"index\"]},null]],\"locals\":[\"list\"]},null]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/container-type.hbs" } });
});
define("ember-inspector/templates/container-types", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "QuvoG1E1", "block": "{\"statements\":[[11,\"div\",[]],[15,\"class\",\"split\"],[13],[0,\"\\n\\n\"],[6,[\"draggable-column\"],null,[[\"width\",\"classes\"],[180,\"split__panel split__panel--sidebar-2 nav\"]],{\"statements\":[[0,\"\\n    \"],[11,\"div\",[]],[15,\"class\",\"split__panel__bd\"],[13],[0,\"\\n      \"],[11,\"div\",[]],[15,\"class\",\"nav__title\"],[13],[0,\"\\n        \"],[11,\"h3\",[]],[13],[0,\"Types\"],[14],[0,\"\\n      \"],[14],[0,\"\\n\\n      \"],[11,\"ul\",[]],[13],[0,\"\\n\"],[6,[\"each\"],[[28,[\"sorted\"]]],null,{\"statements\":[[0,\"          \"],[11,\"li\",[]],[15,\"class\",\"js-container-type\"],[13],[0,\"\\n\"],[6,[\"link-to\"],[\"container-type\",[28,[\"containerType\",\"name\"]]],null,{\"statements\":[[0,\"              \"],[11,\"span\",[]],[15,\"class\",\"js-container-type-name\"],[13],[1,[28,[\"containerType\",\"name\"]],false],[14],[0,\"\\n              (\"],[11,\"span\",[]],[15,\"class\",\"js-container-type-count\"],[13],[1,[28,[\"containerType\",\"count\"]],false],[14],[0,\")\\n\"]],\"locals\":[]},null],[0,\"          \"],[14],[0,\"\\n\"]],\"locals\":[\"containerType\"]},null],[0,\"      \"],[14],[0,\"\\n    \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"\\n  \"],[11,\"div\",[]],[15,\"class\",\"split__panel\"],[13],[0,\"\\n    \"],[11,\"div\",[]],[15,\"class\",\"split__panel__bd\"],[13],[0,\"\\n      \"],[1,[26,[\"outlet\"]],false],[0,\"\\n    \"],[14],[0,\"\\n  \"],[14],[0,\"\\n\"],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/container-types.hbs" } });
});
define("ember-inspector/templates/container-types/index-toolbar", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "vRs6kCGc", "block": "{\"statements\":[[11,\"div\",[]],[15,\"class\",\"toolbar\"],[13],[0,\"\\n  \"],[1,[33,[\"reload-button\"],null,[[\"action\",\"classNames\"],[\"reload\",\"toolbar__icon-button js-reload-container-btn\"]]],false],[0,\"\\n\"],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/container-types/index-toolbar.hbs" } });
});
define("ember-inspector/templates/data", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "iFefh3fQ", "block": "{\"statements\":[[1,[26,[\"outlet\"]],false],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/data.hbs" } });
});
define("ember-inspector/templates/data/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "J/FxM6Yf", "block": "{\"statements\":[[11,\"div\",[]],[15,\"class\",\"data-error-page-container\"],[13],[0,\"\\n\"],[6,[\"not-detected\"],null,[[\"description\"],[\"Data adapter\"]],{\"statements\":[[0,\"  \"],[11,\"li\",[]],[13],[0,\"You are using an old version of Ember (< rc7).\"],[14],[0,\"\\n  \"],[11,\"li\",[]],[13],[0,\"You are using an old version of Ember Data (< 0.14).\"],[14],[0,\"\\n  \"],[11,\"li\",[]],[13],[0,\"You are using another persistence library, in which case:\\n    \"],[11,\"ul\",[]],[13],[0,\"\\n      \"],[11,\"li\",[]],[13],[0,\"Make sure the library has a data adapter.\"],[14],[0,\"\\n    \"],[14],[0,\"\\n  \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/data/index.hbs" } });
});
define("ember-inspector/templates/deprecations-toolbar", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Ddti1j5C", "block": "{\"statements\":[[11,\"div\",[]],[15,\"class\",\"toolbar\"],[13],[0,\"\\n  \"],[1,[33,[\"clear-button\"],null,[[\"action\",\"classNames\"],[\"clear\",\"toolbar__icon-button js-clear-deprecations-btn\"]]],false],[0,\"\\n\\n  \"],[11,\"div\",[]],[15,\"class\",\"toolbar__search js-deprecations-search\"],[13],[0,\"\\n    \"],[1,[33,[\"input\"],null,[[\"value\",\"placeholder\"],[[28,[\"searchVal\"]],\"Search\"]]],false],[0,\"\\n  \"],[14],[0,\"\\n\"],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/deprecations-toolbar.hbs" } });
});
define("ember-inspector/templates/deprecations", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "LEhSGzGS", "block": "{\"statements\":[[6,[\"x-list\"],null,[[\"name\",\"schema\",\"headerHeight\",\"class\"],[\"deprecation-list\",[33,[\"hash\"],null,[[\"columns\"],[null]]],0,\"js-deprecations list_no-alternate-color\"]],{\"statements\":[[6,[\"if\"],[[28,[\"filtered\",\"length\"]]],null,{\"statements\":[[0,\"    \"],[11,\"tbody\",[]],[13],[0,\"\\n\"],[6,[\"each\"],[[28,[\"filtered\"]]],null,{\"statements\":[[0,\"        \"],[1,[33,[\"deprecation-item\"],null,[[\"model\",\"openResource\",\"traceSource\",\"traceDeprecations\",\"class\",\"list\"],[[28,[\"content\"]],[33,[\"action\"],[[28,[null]],\"openResource\"],null],[33,[\"action\"],[[28,[null]],\"traceSource\"],null],[33,[\"action\"],[[28,[null]],\"traceDeprecations\"],null],\"deprecation-item\",[28,[\"list\"]]]]],false],[0,\"\\n\"]],\"locals\":[\"content\"]},null],[0,\"    \"],[14],[0,\"\\n\"]],\"locals\":[]},{\"statements\":[[0,\"    \"],[11,\"div\",[]],[15,\"class\",\"notice js-page-refresh\"],[13],[0,\"\\n      \"],[11,\"p\",[]],[13],[0,\"No deprecations have been detected. Try reloading to catch the deprecations that were logged before you opened the inspector.\"],[14],[0,\"\\n      \"],[11,\"button\",[]],[15,\"class\",\"js-page-refresh-btn\"],[5,[\"action\"],[[28,[null]],\"refreshPage\"]],[13],[0,\"Reload\"],[14],[0,\"\\n    \"],[14],[0,\"\\n\"]],\"locals\":[]}]],\"locals\":[\"list\"]},null]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/deprecations.hbs" } });
});
define("ember-inspector/templates/info", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "0CiHqhRT", "block": "{\"statements\":[[6,[\"x-list\"],null,[[\"name\",\"schema\"],[\"info-list\",[33,[\"schema-for\"],[\"info-list\"],null]]],{\"statements\":[[0,\"  \"],[11,\"tbody\",[]],[13],[0,\"\\n\"],[6,[\"each\"],[[28,[\"model\"]]],null,{\"statements\":[[0,\"      \"],[11,\"tr\",[]],[15,\"class\",\"list__row js-library-row\"],[13],[0,\"\\n\"],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],[[\"class\"],[\"list__cell_main\"]],{\"statements\":[[0,\"          \"],[11,\"span\",[]],[15,\"class\",\"js-lib-name\"],[13],[1,[28,[\"library\",\"name\"]],false],[14],[0,\"\\n\"]],\"locals\":[]},null],[6,[\"component\"],[[28,[\"list\",\"cell\"]]],null,{\"statements\":[[0,\"          \"],[11,\"span\",[]],[15,\"class\",\"js-lib-version\"],[13],[1,[28,[\"library\",\"version\"]],false],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"      \"],[14],[0,\"\\n\"]],\"locals\":[\"library\"]},null],[0,\"  \"],[14],[0,\"\\n\"]],\"locals\":[\"list\"]},null]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/info.hbs" } });
});
define("ember-inspector/templates/loading", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "lkQi3Si4", "block": "{\"statements\":[],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/loading.hbs" } });
});
define("ember-inspector/templates/model-types-toolbar", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Haeh2nJ3", "block": "{\"statements\":[[11,\"div\",[]],[15,\"class\",\"toolbar\"],[13],[0,\"\\n    \"],[11,\"div\",[]],[15,\"class\",\"toolbar__checkbox js-filter-hide-empty-model-typess\"],[13],[0,\"\\n      \"],[1,[33,[\"input\"],null,[[\"type\",\"checked\",\"id\"],[\"checkbox\",[28,[\"options\",\"hideEmptyModelTypes\"]],\"options-hideEmptyModelTypes\"]]],false],[0,\" \"],[11,\"label\",[]],[15,\"for\",\"options-hideEmptyModelTypes\"],[13],[0,\"Hide Empty Model Types\"],[14],[0,\"\\n    \"],[14],[0,\"\\n\"],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/model-types-toolbar.hbs" } });
});
define("ember-inspector/templates/model-types", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "spNo8J5E", "block": "{\"statements\":[[11,\"div\",[]],[15,\"class\",\"split\"],[13],[0,\"\\n\"],[6,[\"draggable-column\"],null,[[\"width\",\"classes\"],[[28,[\"navWidth\"]],\"split__panel split__panel--sidebar-2 nav\"]],{\"statements\":[[0,\"    \"],[11,\"div\",[]],[15,\"class\",\"split__panel__bd\"],[13],[0,\"\\n      \"],[11,\"div\",[]],[15,\"class\",\"nav__title\"],[13],[11,\"h3\",[]],[13],[0,\"Model Types\"],[14],[14],[0,\"\\n      \"],[11,\"ul\",[]],[13],[0,\"\\n\"],[6,[\"each\"],[[28,[\"sorted\"]]],null,{\"statements\":[[0,\"          \"],[11,\"li\",[]],[15,\"class\",\"js-model-type\"],[13],[0,\"\\n\"],[6,[\"link-to\"],[\"records\",[33,[\"escape-url\"],[[28,[\"modelType\",\"name\"]]],null]],null,{\"statements\":[[0,\"              \"],[11,\"span\",[]],[15,\"class\",\"js-model-type-name\"],[13],[1,[28,[\"modelType\",\"name\"]],false],[14],[0,\"\\n              (\"],[11,\"span\",[]],[15,\"class\",\"js-model-type-count\"],[13],[1,[28,[\"modelType\",\"count\"]],false],[14],[0,\")\\n\"]],\"locals\":[]},null],[0,\"          \"],[14],[0,\"\\n\"]],\"locals\":[\"modelType\"]},null],[0,\"      \"],[14],[0,\"\\n    \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"\\n  \"],[11,\"div\",[]],[15,\"class\",\"split__panel\"],[13],[0,\"\\n    \"],[11,\"div\",[]],[15,\"class\",\"split__panel__bd\"],[13],[0,\"\\n      \"],[1,[26,[\"outlet\"]],false],[0,\"\\n    \"],[14],[0,\"\\n  \"],[14],[0,\"\\n\"],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/model-types.hbs" } });
});
define("ember-inspector/templates/nav", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "7Zg/LMwc", "block": "{\"statements\":[[11,\"nav\",[]],[15,\"class\",\"nav nav--main\"],[13],[0,\"\\n  \"],[11,\"ul\",[]],[13],[0,\"\\n    \"],[11,\"li\",[]],[13],[0,\"\\n\"],[6,[\"link-to\"],[\"view-tree\"],null,{\"statements\":[[0,\"        View Tree\\n        \"],[11,\"svg\",[]],[15,\"version\",\"1.1\"],[15,\"xmlns\",\"http://www.w3.org/2000/svg\",\"http://www.w3.org/2000/xmlns/\"],[15,\"xmlns:xlink\",\"http://www.w3.org/1999/xlink\",\"http://www.w3.org/2000/xmlns/\"],[15,\"x\",\"0px\"],[15,\"y\",\"0px\"],[15,\"width\",\"19px\"],[15,\"height\",\"19px\"],[15,\"viewBox\",\"0 0 19 19\"],[15,\"enable-background\",\"new 0 0 19 19\"],[15,\"xml:space\",\"preserve\",\"http://www.w3.org/XML/1998/namespace\"],[13],[0,\"\\n          \"],[11,\"path\",[]],[15,\"fill\",\"#454545\"],[15,\"d\",\"M0,0v19h19V0H0z M6,17h-4V5h4V17z M17,17H7V5h10v12H17z M17,4H2V2h15V1z\"],[13],[14],[0,\"\\n        \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"    \"],[14],[0,\"\\n    \"],[11,\"li\",[]],[13],[0,\"\\n\"],[6,[\"link-to\"],[\"route-tree\"],null,{\"statements\":[[0,\"        Routes\\n        \"],[11,\"svg\",[]],[15,\"version\",\"1.1\"],[15,\"xmlns\",\"http://www.w3.org/2000/svg\",\"http://www.w3.org/2000/xmlns/\"],[15,\"xmlns:xlink\",\"http://www.w3.org/1999/xlink\",\"http://www.w3.org/2000/xmlns/\"],[15,\"x\",\"0px\"],[15,\"y\",\"0px\"],[15,\"width\",\"19px\"],[15,\"height\",\"19px\"],[15,\"viewBox\",\"0 0 19 19\"],[15,\"enable-background\",\"new 0 0 19 19\"],[15,\"xml:space\",\"preserve\",\"http://www.w3.org/XML/1998/namespace\"],[13],[0,\"\\n          \"],[11,\"polygon\",[]],[15,\"fill\",\"#454545\"],[15,\"points\",\"0.591,17.012 2.36,17.012 6.841,2.086 5.07,2.086\"],[13],[14],[0,\"\\n          \"],[11,\"path\",[]],[15,\"fill\",\"#454545\"],[15,\"d\",\"M18.117,8.495l0.292-1.494h-2.242l0.874-3.507h-1.544l-0.874,3.507h-1.88l0.874-3.507h-1.536l-0.883,3.507 H8.668L8.375,8.495h2.449l-0.616,2.474H7.875l-0.292,1.495h2.252l-0.883,3.515h1.544l0.874-3.515h1.888l-0.883,3.515h1.544 l0.874-3.515h2.53l0.303-1.495h-2.459l0.625-2.474H18.117z M14.249,8.495l-0.617,2.474h-1.888l0.625-2.474H14.249z\"],[13],[14],[0,\"\\n        \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"    \"],[14],[0,\"\\n    \"],[11,\"li\",[]],[13],[0,\"\\n\"],[6,[\"link-to\"],[\"data\"],null,{\"statements\":[[0,\"        Data\\n        \"],[11,\"svg\",[]],[15,\"version\",\"1.1\"],[15,\"xmlns\",\"http://www.w3.org/2000/svg\",\"http://www.w3.org/2000/xmlns/\"],[15,\"xmlns:xlink\",\"http://www.w3.org/1999/xlink\",\"http://www.w3.org/2000/xmlns/\"],[15,\"x\",\"0px\"],[15,\"y\",\"0px\"],[15,\"width\",\"19px\"],[15,\"height\",\"19px\"],[15,\"viewBox\",\"0 0 19 19\"],[15,\"enable-background\",\"new 0 0 19 19\"],[15,\"xml:space\",\"preserve\",\"http://www.w3.org/XML/1998/namespace\"],[13],[0,\"\\n          \"],[11,\"path\",[]],[15,\"d\",\"M9.5,0.001C3.907,0.001,0,1.507,0,3.663v11.675C0,17.494,3.907,19,9.5,19c5.594,0,9.5-1.506,9.5-3.662V3.663 C19,1.507,15.094,0.001,9.5,0.001z M9.5,5.669c-4.768,0-7.81-1.318-7.81-2.007c0-0.689,3.042-2.008,7.81-2.008 c4.769,0,7.81,1.318,7.81,2.008C17.31,4.352,14.269,5.669,9.5,5.669z M17.31,15.338c0,0.689-3.041,2.007-7.81,2.007 c-4.768,0-7.81-1.317-7.81-2.007V5.852C3.39,6.77,6.282,7.324,9.5,7.324c3.217,0,6.108-0.554,7.81-1.472V15.338z\"],[13],[14],[0,\"\\n        \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"    \"],[14],[0,\"\\n    \"],[11,\"li\",[]],[13],[0,\"\\n\"],[6,[\"link-to\"],[\"deprecations\"],null,{\"statements\":[[0,\"        Deprecations\\n        \"],[11,\"svg\",[]],[15,\"version\",\"1.1\"],[15,\"id\",\"Layer_1\"],[15,\"xmlns\",\"http://www.w3.org/2000/svg\",\"http://www.w3.org/2000/xmlns/\"],[15,\"xmlns:xlink\",\"http://www.w3.org/1999/xlink\",\"http://www.w3.org/2000/xmlns/\"],[15,\"x\",\"0px\"],[15,\"y\",\"0px\"],[15,\"width\",\"20\"],[15,\"height\",\"18\"],[15,\"viewBox\",\"0 0 20.565 18.33\"],[15,\"enable-background\",\"new 0 0 20.565 18.33\"],[15,\"xml:space\",\"preserve\",\"http://www.w3.org/XML/1998/namespace\"],[13],[0,\"\\n        \"],[11,\"g\",[]],[13],[0,\"\\n          \"],[11,\"path\",[]],[15,\"d\",\"M19.58,18.33H0.985c-0.351,0-0.674-0.187-0.851-0.489c-0.177-0.303-0.179-0.677-0.006-0.982L9.426,0.463\\n            c0.35-0.617,1.363-0.617,1.713,0l9.297,16.396c0.173,0.305,0.17,0.679-0.006,0.982S19.931,18.33,19.58,18.33z M2.676,16.36h15.213\\n            L10.283,2.946L2.676,16.36z\"],[13],[14],[0,\"\\n          \"],[11,\"g\",[]],[13],[0,\"\\n            \"],[11,\"path\",[]],[15,\"fill-rule\",\"evenodd\"],[15,\"clip-rule\",\"evenodd\"],[15,\"d\",\"M11.265,8.038c-0.082,1.158-0.162,2.375-0.259,3.594\\n              c-0.021,0.271-0.088,0.544-0.169,0.806c-0.079,0.257-0.266,0.358-0.553,0.358c-0.289,0-0.489-0.098-0.553-0.358\\n              c-0.096-0.394-0.167-0.799-0.201-1.203c-0.088-1.068-0.159-2.138-0.22-3.208c-0.017-0.289-0.011-0.588,0.047-0.87\\n              c0.084-0.409,0.486-0.673,0.933-0.67c0.439,0.003,0.812,0.27,0.924,0.667c0.024,0.08,0.045,0.163,0.049,0.245\\n              C11.271,7.59,11.265,7.784,11.265,8.038z\"],[13],[14],[0,\"\\n            \"],[11,\"path\",[]],[15,\"fill-rule\",\"evenodd\"],[15,\"clip-rule\",\"evenodd\"],[15,\"d\",\"M11.285,14.534c0.004,0.554-0.436,1.004-0.991,1.015\\n              c-0.552,0.01-1.015-0.45-1.013-1.008c0.001-0.552,0.449-1.004,1-1.007C10.829,13.531,11.281,13.983,11.285,14.534z\"],[13],[14],[0,\"\\n          \"],[14],[0,\"\\n        \"],[14],[0,\"\\n        \"],[14],[0,\"\\n\\n        \"],[11,\"span\",[]],[15,\"class\",\"pill pill_not-clickable\"],[13],[1,[26,[\"deprecationCount\"]],false],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"    \"],[14],[0,\"\\n    \"],[11,\"li\",[]],[13],[0,\"\\n\"],[6,[\"link-to\"],[\"info\"],null,{\"statements\":[[0,\"      Info\\n      \"],[11,\"svg\",[]],[15,\"width\",\"19\"],[15,\"height\",\"19\"],[15,\"xmlns\",\"http://www.w3.org/2000/svg\",\"http://www.w3.org/2000/xmlns/\"],[13],[0,\"\\n        \"],[11,\"rect\",[]],[15,\"id\",\"svg_3\"],[15,\"height\",\"6.815\"],[15,\"width\",\"3.33\"],[15,\"fill\",\"#454545\"],[15,\"y\",\"7.8805\"],[15,\"x\",\"7.737\"],[13],[14],[0,\"\\n        \"],[11,\"circle\",[]],[15,\"id\",\"svg_4\"],[15,\"r\",\"1.753\"],[15,\"cy\",\"5.3775\"],[15,\"cx\",\"9.451\"],[15,\"fill\",\"#454545\"],[13],[14],[0,\"\\n        \"],[11,\"path\",[]],[15,\"id\",\"svg_6\"],[15,\"d\",\"m9.5,19c-5.238,0 -9.5,-4.262 -9.5,-9.5c0,-5.238 4.262,-9.5 9.5,-9.5s9.5,4.262 9.5,9.5c0,5.238 -4.262,9.5 -9.5,9.5zm0,-17.434c-4.375,0 -7.933,3.559 -7.933,7.933c0,4.374 3.559,7.932 7.933,7.932c4.374,0 7.933,-3.559 7.933,-7.932c0,-4.374 -3.559,-7.933 -7.933,-7.933z\"],[15,\"fill\",\"#454545\"],[13],[14],[0,\"\\n      \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"    \"],[14],[0,\"\\n  \"],[14],[0,\"\\n  \"],[11,\"div\",[]],[15,\"class\",\"nav__title nav__title--middle\"],[13],[0,\"\\n    \"],[11,\"h3\",[]],[13],[0,\"Advanced\"],[14],[0,\"\\n  \"],[14],[0,\"\\n  \"],[11,\"ul\",[]],[13],[0,\"\\n    \"],[11,\"li\",[]],[13],[0,\"\\n\"],[6,[\"link-to\"],[\"promise-tree\"],null,{\"statements\":[[0,\"        Promises\\n        \"],[11,\"svg\",[]],[15,\"version\",\"1.1\"],[15,\"xmlns\",\"http://www.w3.org/2000/svg\",\"http://www.w3.org/2000/xmlns/\"],[15,\"xmlns:xlink\",\"http://www.w3.org/1999/xlink\",\"http://www.w3.org/2000/xmlns/\"],[15,\"x\",\"0px\"],[15,\"y\",\"0px\"],[15,\"width\",\"23px\"],[15,\"height\",\"23px\"],[15,\"viewBox\",\"0 0 23 23\"],[15,\"enable-background\",\"new 0 0 23 23\"],[15,\"xml:space\",\"preserve\",\"http://www.w3.org/XML/1998/namespace\"],[13],[0,\"\\n          \"],[11,\"path\",[]],[15,\"d\",\"M19,0 L19,19 L-0,19 L-0,0 z M2,2 L2,17 L17,17 L17,2.832 L6.807,12.912 L5.12,12.923 L5.12,2 z M7,2 L7.12,9.863 L15.953,2 z\"],[13],[14],[0,\"\\n          \"],[11,\"path\",[]],[15,\"d\",\"M6.066,13.643 C4.488,13.643 3.208,12.363 3.208,10.784 C3.208,9.206 4.488,7.926 6.066,7.926 C7.645,7.926 8.925,9.206 8.925,10.784 C8.925,12.363 7.645,13.643 6.066,13.643 z\"],[13],[14],[0,\"\\n        \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"    \"],[14],[0,\"\\n    \"],[11,\"li\",[]],[13],[0,\"\\n\"],[6,[\"link-to\"],[\"container-types\"],null,{\"statements\":[[0,\"      Container\\n\\n      \"],[11,\"svg\",[]],[15,\"version\",\"1.1\"],[15,\"xmlns\",\"http://www.w3.org/2000/svg\",\"http://www.w3.org/2000/xmlns/\"],[15,\"xmlns:xlink\",\"http://www.w3.org/1999/xlink\",\"http://www.w3.org/2000/xmlns/\"],[15,\"x\",\"0px\"],[15,\"y\",\"0px\"],[15,\"width\",\"19px\"],[15,\"height\",\"19px\"],[15,\"viewBox\",\"0 0 43 42.191\"],[15,\"enable-background\",\"new 0 0 43 42.191\"],[15,\"xml:space\",\"preserve\",\"http://www.w3.org/XML/1998/namespace\"],[13],[0,\"\\n      \"],[11,\"g\",[]],[13],[0,\"\\n        \"],[11,\"path\",[]],[15,\"d\",\"M20.038,42.092L18,40.691V15.687l1.07-1.437l22-6.585L43,9.102v23.138l-0.962,1.4L20.038,42.092z M21,16.804v21.704\\n          l19-7.299V11.116L21,16.804z\"],[13],[14],[0,\"\\n        \"],[11,\"path\",[]],[15,\"d\",\"M19.647,42.191c-0.224,0-0.452-0.05-0.666-0.156L0.833,33.028L0,31.685V8.01l2.075-1.386l18.507,7.677\\n          c0.765,0.317,1.128,1.195,0.811,1.961c-0.318,0.765-1.195,1.129-1.96,0.811L3,10.256v20.499l17.315,8.593\\n          c0.742,0.368,1.045,1.269,0.677,2.011C20.73,41.886,20.199,42.191,19.647,42.191z\"],[13],[14],[0,\"\\n        \"],[11,\"path\",[]],[15,\"d\",\"M41.414,10.602c-0.193,0-0.391-0.037-0.58-0.116L23.047,3.027L2.096,9.444C1.303,9.688,0.465,9.24,0.223,8.449\\n          C-0.02,7.657,0.425,6.818,1.217,6.575L22.687,0l1.02,0.051l18.288,7.667c0.764,0.32,1.124,1.2,0.804,1.964\\n          C42.557,10.256,42,10.602,41.414,10.602z\"],[13],[14],[0,\"\\n      \"],[14],[0,\"\\n      \"],[14],[0,\"\\n\\n\"]],\"locals\":[]},null],[0,\"    \"],[14],[0,\"\\n    \"],[11,\"li\",[]],[13],[0,\"\\n\"],[6,[\"link-to\"],[\"render-tree\"],null,{\"statements\":[[0,\"      Render Performance\\n      \"],[11,\"svg\",[]],[15,\"version\",\"1.1\"],[15,\"id\",\"Layer_1\"],[15,\"xmlns\",\"http://www.w3.org/2000/svg\",\"http://www.w3.org/2000/xmlns/\"],[15,\"xmlns:xlink\",\"http://www.w3.org/1999/xlink\",\"http://www.w3.org/2000/xmlns/\"],[15,\"x\",\"0px\"],[15,\"y\",\"0px\"],[15,\"width\",\"18.979px\"],[15,\"height\",\"18.979px\"],[15,\"viewBox\",\"0.021 -0.018 18.979 18.979\"],[15,\"enable-background\",\"new 0.021 -0.018 18.979 18.979\"],[15,\"xml:space\",\"preserve\",\"http://www.w3.org/XML/1998/namespace\"],[13],[0,\"\\n      \"],[11,\"g\",[]],[13],[0,\"\\n        \"],[11,\"path\",[]],[15,\"d\",\"M8.358,11.589c0.291,0.299,0.674,0.45,1.053,0.45c0.347,0,0.69-0.126,0.955-0.384c0.553-0.535,5.625-7.474,5.625-7.474\\n          s-7.089,4.864-7.641,5.4C7.798,10.12,7.803,11.017,8.358,11.589z\"],[13],[14],[0,\"\\n        \"],[11,\"g\",[]],[13],[0,\"\\n          \"],[11,\"path\",[]],[15,\"d\",\"M16.057,2.615c-1.702-1.627-4.005-2.633-6.546-2.633c-5.237,0-9.482,4.246-9.482,9.482c0,2.816,1.233,5.336,3.182,7.073\\n            c-1.22-1.439-1.959-3.299-1.959-5.333c0-4.561,3.698-8.259,8.26-8.259c1.577,0,3.045,0.45,4.298,1.216\\n            c0.561-0.386,1.067-0.734,1.472-1.011L16.057,2.615z\"],[13],[14],[0,\"\\n          \"],[11,\"path\",[]],[15,\"d\",\"M17.005,4.923c-0.26,0.354-0.582,0.794-0.936,1.275c1.062,1.39,1.7,3.121,1.7,5.005c0,2.037-0.741,3.898-1.963,5.338\\n            c1.951-1.736,3.187-4.259,3.187-7.078c0-1.905-0.568-3.676-1.535-5.162L17.005,4.923z\"],[13],[14],[0,\"\\n        \"],[14],[0,\"\\n      \"],[14],[0,\"\\n      \"],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"    \"],[14],[0,\"\\n  \"],[14],[0,\"\\n\"],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/nav.hbs" } });
});
define("ember-inspector/templates/page-refresh", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "HuIKUilv", "block": "{\"statements\":[[11,\"div\",[]],[15,\"class\",\"notice js-page-refresh\"],[13],[0,\"\\n  \"],[11,\"p\",[]],[13],[0,\"Reload the page to see promises created before you opened the inspector.\"],[14],[0,\"\\n  \"],[11,\"button\",[]],[15,\"class\",\"js-page-refresh-btn\"],[5,[\"action\"],[[28,[null]],\"refreshPage\"]],[13],[0,\"Reload\"],[14],[0,\"\\n\"],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/page-refresh.hbs" } });
});
define("ember-inspector/templates/promise-tree-toolbar", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Wl6riPbS", "block": "{\"statements\":[[11,\"div\",[]],[15,\"class\",\"toolbar\"],[13],[0,\"\\n  \"],[1,[33,[\"clear-button\"],null,[[\"action\",\"classNames\"],[\"clear\",\"toolbar__icon-button js-clear-promises-btn\"]]],false],[0,\"\\n\\n  \"],[11,\"div\",[]],[15,\"class\",\"toolbar__search js-promise-search\"],[13],[0,\"\\n    \"],[1,[33,[\"input\"],null,[[\"value\",\"placeholder\"],[[28,[\"search\"]],\"Search\"]]],false],[0,\"\\n  \"],[14],[0,\"\\n\\n  \"],[11,\"button\",[]],[16,\"class\",[34,[[33,[\"if\"],[[28,[\"noFilter\"]],\"active\"],null],\" toolbar__radio js-filter\"]]],[5,[\"action\"],[[28,[null]],\"setFilter\",\"all\"]],[13],[0,\"\\n    All\\n  \"],[14],[0,\"\\n\\n  \"],[11,\"div\",[]],[15,\"class\",\"divider\"],[13],[14],[0,\"\\n\\n  \"],[11,\"button\",[]],[16,\"class\",[34,[[33,[\"if\"],[[28,[\"isRejectedFilter\"]],\"active\"],null],\" toolbar__radio js-filter\"]]],[5,[\"action\"],[[28,[null]],\"setFilter\",\"rejected\"]],[13],[0,\"Rejected\"],[14],[0,\"\\n  \"],[11,\"button\",[]],[16,\"class\",[34,[[33,[\"if\"],[[28,[\"isPendingFilter\"]],\"active\"],null],\" toolbar__radio js-filter\"]]],[5,[\"action\"],[[28,[null]],\"setFilter\",\"pending\"]],[13],[0,\"Pending\"],[14],[0,\"\\n  \"],[11,\"button\",[]],[16,\"class\",[34,[[33,[\"if\"],[[28,[\"isFulfilledFilter\"]],\"active\"],null],\" toolbar__radio js-filter\"]]],[5,[\"action\"],[[28,[null]],\"setFilter\",\"fulfilled\"]],[13],[0,\"Fulfilled\"],[14],[0,\"\\n\\n  \"],[11,\"div\",[]],[15,\"class\",\"divider\"],[13],[14],[0,\"\\n\\n  \"],[11,\"div\",[]],[15,\"class\",\"toolbar__checkbox js-with-stack\"],[13],[0,\"\\n    \"],[1,[33,[\"action-checkbox\"],null,[[\"on-update\",\"checked\",\"id\"],[\"updateInstrumentWithStack\",[28,[\"instrumentWithStack\"]],\"instrument-with-stack\"]]],false],[0,\" \"],[11,\"label\",[]],[15,\"for\",\"instrument-with-stack\"],[13],[0,\"Trace promises\"],[14],[0,\"\\n  \"],[14],[0,\"\\n\\n\\n\"],[6,[\"unless\"],[[28,[\"shouldRefresh\"]]],null,{\"statements\":[[0,\"    \"],[11,\"div\",[]],[15,\"class\",\"divider\"],[13],[14],[0,\"\\n    \"],[11,\"button\",[]],[15,\"class\",\"js-toolbar-page-refresh-btn\"],[5,[\"action\"],[[28,[null]],\"refreshPage\"]],[13],[0,\"Reload\"],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"\\n\"],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/promise-tree-toolbar.hbs" } });
});
define("ember-inspector/templates/promise-tree", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "30dgiYbx", "block": "{\"statements\":[[6,[\"if\"],[[28,[\"shouldRefresh\"]]],null,{\"statements\":[[0,\"  \"],[19,\"page_refresh\"],[0,\"\\n\"]],\"locals\":[]},{\"statements\":[[6,[\"x-list\"],null,[[\"name\",\"schema\",\"class\"],[\"promise-tree\",[33,[\"schema-for\"],[\"promise-tree\"],null],\"js-promise-tree\"]],{\"statements\":[[6,[\"component\"],[[28,[\"list\",\"vertical-collection\"]]],[[\"content\"],[[28,[\"filtered\"]]]],{\"statements\":[[0,\"      \"],[1,[33,[\"promise-item\"],null,[[\"model\",\"filter\",\"effectiveSearch\",\"toggleExpand\",\"tracePromise\",\"inspectObject\",\"sendValueToConsole\",\"list\"],[[28,[\"content\"]],[28,[\"filter\"]],[28,[\"effectiveSearch\"]],[33,[\"action\"],[[28,[null]],\"toggleExpand\"],null],[33,[\"action\"],[[28,[null]],\"tracePromise\"],null],[33,[\"action\"],[[28,[null]],\"inspectObject\"],null],[33,[\"action\"],[[28,[null]],\"sendValueToConsole\"],null],[28,[\"list\"]]]]],false],[0,\"\\n\"]],\"locals\":[\"content\"]},null]],\"locals\":[\"list\"]},null]],\"locals\":[]}]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":true}", "meta": { "moduleName": "ember-inspector/templates/promise-tree.hbs" } });
});
define("ember-inspector/templates/records-toolbar", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "3BzzRFnQ", "block": "{\"statements\":[[11,\"div\",[]],[15,\"class\",\"toolbar\"],[13],[0,\"\\n  \"],[11,\"div\",[]],[15,\"class\",\"toolbar__search js-records-search\"],[13],[0,\"\\n    \"],[1,[33,[\"input\"],null,[[\"value\",\"placeholder\"],[[28,[\"search\"]],\"Search\"]]],false],[0,\"\\n  \"],[14],[0,\"\\n\\n  \"],[11,\"button\",[]],[16,\"class\",[34,[[33,[\"if\"],[[28,[\"noFilterValue\"]],\"active\"],null],\" toolbar__radio js-filter\"]]],[5,[\"action\"],[[28,[null]],\"setFilter\"]],[13],[0,\"\\n    All\\n  \"],[14],[0,\"\\n\\n  \"],[11,\"div\",[]],[15,\"class\",\"divider\"],[13],[14],[0,\"\\n\"],[6,[\"each\"],[[28,[\"filters\"]]],null,{\"statements\":[[6,[\"record-filter\"],null,[[\"model\",\"filterValue\"],[[28,[\"item\"]],[28,[\"filterValue\"]]]],{\"statements\":[[0,\"      \"],[11,\"button\",[]],[16,\"class\",[34,[[33,[\"if\"],[[28,[\"filter\",\"checked\"]],\"active\"],null],\" toolbar__radio js-filter\"]]],[5,[\"action\"],[[28,[null]],\"setFilter\",[28,[\"filter\",\"model\",\"name\"]]]],[13],[0,\"\\n        \"],[1,[28,[\"filter\",\"model\",\"desc\"]],false],[0,\"\\n      \"],[14],[0,\"\\n\"]],\"locals\":[\"filter\"]},null]],\"locals\":[\"item\"]},null],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/records-toolbar.hbs" } });
});
define("ember-inspector/templates/records", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "ktKcYkrO", "block": "{\"statements\":[[6,[\"x-list\"],null,[[\"name\",\"schema\",\"storageKey\",\"itemClass\"],[\"record-list\",[28,[\"schema\"]],[33,[\"concat\"],[\"record-list-\",[28,[\"modelType\",\"name\"]]],null],\"list__row_highlight\"]],{\"statements\":[[0,\"\\n\"],[6,[\"component\"],[[28,[\"list\",\"vertical-collection\"]]],[[\"content\"],[[28,[\"filtered\"]]]],{\"statements\":[[0,\"    \"],[1,[33,[\"record-item\"],null,[[\"model\",\"modelTypeColumns\",\"list\",\"index\",\"on-click\"],[[28,[\"content\"]],[28,[\"columns\"]],[28,[\"list\"]],[28,[\"index\"]],[33,[\"action\"],[[28,[null]],\"inspectModel\",[28,[\"content\"]]],null]]]],false],[0,\"\\n\"]],\"locals\":[\"content\",\"index\"]},null]],\"locals\":[\"list\"]},null]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/records.hbs" } });
});
define("ember-inspector/templates/render-tree-toolbar", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "0CoscCPy", "block": "{\"statements\":[[11,\"div\",[]],[15,\"class\",\"toolbar\"],[13],[0,\"\\n  \"],[1,[33,[\"clear-button\"],null,[[\"action\",\"classNames\"],[\"clearProfiles\",\"toolbar__icon-button\"]]],false],[0,\"\\n  \"],[11,\"div\",[]],[15,\"class\",\"toolbar__search js-render-profiles-search\"],[13],[0,\"\\n    \"],[1,[33,[\"input\"],null,[[\"value\",\"placeholder\"],[[28,[\"searchField\"]],\"Search\"]]],false],[0,\"\\n  \"],[14],[0,\"\\n  \"],[11,\"div\",[]],[15,\"class\",\"filter-bar__pills\"],[13],[14],[0,\"\\n\\n\"],[6,[\"unless\"],[[28,[\"showEmpty\"]]],null,{\"statements\":[[0,\"    \"],[11,\"div\",[]],[15,\"class\",\"divider\"],[13],[14],[0,\"\\n    \"],[11,\"button\",[]],[15,\"class\",\"js-toolbar-page-refresh-btn\"],[5,[\"action\"],[[28,[null]],\"refreshPage\"]],[13],[0,\"Reload\"],[14],[0,\"\\n\"]],\"locals\":[]},null],[0,\"\\n\"],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/render-tree-toolbar.hbs" } });
});
define("ember-inspector/templates/render-tree", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "va+biz0/", "block": "{\"statements\":[[6,[\"unless\"],[[28,[\"isWarningClosed\"]]],null,{\"statements\":[[0,\"  \"],[1,[33,[\"warning-message\"],null,[[\"close\"],[[33,[\"action\"],[[28,[null]],\"closeWarning\"],null]]]],false],[0,\"\\n\"]],\"locals\":[]},null],[0,\"\\n\"],[6,[\"if\"],[[28,[\"showEmpty\"]]],null,{\"statements\":[[0,\"  \"],[11,\"div\",[]],[15,\"class\",\"notice js-render-tree-empty\"],[13],[0,\"\\n    \"],[11,\"p\",[]],[13],[0,\"No rendering metrics have been collected. Try reloading or navigating around your application.\"],[14],[0,\"\\n    \"],[11,\"p\",[]],[13],[11,\"strong\",[]],[13],[0,\"Note:\"],[14],[0,\" Very fast rendering times (<1ms) are excluded.\"],[14],[0,\"\\n    \"],[11,\"button\",[]],[15,\"class\",\"js-toolbar-page-refresh-btn\"],[5,[\"action\"],[[28,[null]],\"refreshPage\"]],[13],[0,\"Reload\"],[14],[0,\"\\n  \"],[14],[0,\"\\n\"]],\"locals\":[]},{\"statements\":[[6,[\"x-list\"],null,[[\"name\",\"schema\",\"class\",\"headerHeight\"],[\"render-tree\",[33,[\"schema-for\"],[\"render-tree\"],null],\"js-render-tree\",[28,[\"headerHeight\"]]]],{\"statements\":[[0,\"    \"],[11,\"tbody\",[]],[13],[0,\"\\n\"],[6,[\"each\"],[[28,[\"filtered\"]]],null,{\"statements\":[[0,\"        \"],[1,[33,[\"render-item\"],null,[[\"model\",\"search\",\"list\"],[[28,[\"item\"]],[28,[\"search\"]],[28,[\"list\"]]]]],false],[0,\"\\n\"]],\"locals\":[\"item\"]},null],[0,\"    \"],[14],[0,\"\\n\"]],\"locals\":[\"list\"]},null]],\"locals\":[]}]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/render-tree.hbs" } });
});
define("ember-inspector/templates/route-tree-toolbar", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "Aq1fXi6z", "block": "{\"statements\":[[11,\"div\",[]],[15,\"class\",\"toolbar\"],[13],[0,\"\\n  \"],[11,\"div\",[]],[15,\"class\",\"toolbar__checkbox js-filter-hide-routes\"],[13],[0,\"\\n    \"],[1,[33,[\"input\"],null,[[\"type\",\"checked\",\"id\"],[\"checkbox\",[28,[\"options\",\"hideRoutes\"]],\"options-hideRoutes\"]]],false],[0,\" \"],[11,\"label\",[]],[15,\"for\",\"options-hideRoutes\"],[13],[0,\"Current Route only\"],[14],[0,\"\\n  \"],[14],[0,\"\\n\"],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/route-tree-toolbar.hbs" } });
});
define("ember-inspector/templates/route-tree", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "DG5EarL8", "block": "{\"statements\":[[6,[\"x-list\"],null,[[\"name\",\"schema\"],[\"route-tree\",[33,[\"schema-for\"],[\"route-tree\"],null]]],{\"statements\":[[6,[\"component\"],[[28,[\"list\",\"vertical-collection\"]]],[[\"content\"],[[28,[\"filtered\"]]]],{\"statements\":[[0,\"    \"],[1,[33,[\"route-item\"],null,[[\"model\",\"currentRoute\",\"inspectRoute\",\"sendRouteHandlerToConsole\",\"inspectController\",\"sendControllerToConsole\",\"list\"],[[28,[\"content\"]],[28,[\"currentRoute\"]],[33,[\"action\"],[[28,[null]],\"inspectRoute\"],null],[33,[\"action\"],[[28,[null]],\"sendRouteHandlerToConsole\"],null],[33,[\"action\"],[[28,[null]],\"inspectController\"],null],[33,[\"action\"],[[28,[null]],\"sendControllerToConsole\"],null],[28,[\"list\"]]]]],false],[0,\"\\n\"]],\"locals\":[\"content\"]},null]],\"locals\":[\"list\"]},null]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/route-tree.hbs" } });
});
define("ember-inspector/templates/view-tree-toolbar", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "tTnM+aAL", "block": "{\"statements\":[[11,\"div\",[]],[15,\"class\",\"toolbar\"],[13],[0,\"\\n  \"],[11,\"button\",[]],[16,\"class\",[34,[[33,[\"if\"],[[28,[\"inspectingViews\"]],\"active\"],null],\" toolbar__icon-button js-inspect-views\"]]],[5,[\"action\"],[[28,[null]],\"toggleViewInspection\"]],[13],[0,\"\\n    \"],[11,\"svg\",[]],[15,\"width\",\"16px\"],[15,\"height\",\"16px\"],[15,\"viewBox\",\"0 0 16 16\"],[15,\"version\",\"1.1\"],[15,\"xmlns\",\"http://www.w3.org/2000/svg\",\"http://www.w3.org/2000/xmlns/\"],[15,\"xmlns:xlink\",\"http://www.w3.org/1999/xlink\",\"http://www.w3.org/2000/xmlns/\"],[13],[0,\"\\n      \"],[11,\"g\",[]],[15,\"class\",\"svg-stroke\"],[15,\"transform\",\"translate(3.000000, 4.000000)\"],[15,\"stroke\",\"#000000\"],[15,\"stroke-width\",\"2\"],[15,\"fill\",\"none\"],[15,\"fill-rule\",\"evenodd\"],[13],[0,\"\\n        \"],[11,\"path\",[]],[15,\"d\",\"M7.5,7.5 L10.5,10.5\"],[15,\"stroke-linecap\",\"square\"],[13],[14],[0,\"\\n        \"],[11,\"circle\",[]],[15,\"cx\",\"4\"],[15,\"cy\",\"4\"],[15,\"r\",\"4\"],[13],[14],[0,\"\\n      \"],[14],[0,\"\\n    \"],[14],[0,\"\\n  \"],[14],[0,\"\\n\\n  \"],[11,\"div\",[]],[15,\"class\",\"divider\"],[13],[14],[0,\"\\n\\n  \"],[11,\"div\",[]],[15,\"class\",\"toolbar__checkbox js-filter-components\"],[13],[0,\"\\n    \"],[1,[33,[\"input\"],null,[[\"type\",\"checked\",\"id\"],[\"checkbox\",[28,[\"options\",\"components\"]],\"options-components\"]]],false],[0,\" \"],[11,\"label\",[]],[15,\"for\",\"options-components\"],[13],[0,\"Components\"],[14],[0,\"\\n  \"],[14],[0,\"\\n\"],[14],[0,\"\\n\"]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/view-tree-toolbar.hbs" } });
});
define("ember-inspector/templates/view-tree", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = Ember.HTMLBars.template({ "id": "oIeitidc", "block": "{\"statements\":[[6,[\"x-list\"],null,[[\"name\",\"schema\"],[\"view-tree\",[33,[\"schema-for\"],[\"view-tree\"],null]]],{\"statements\":[[6,[\"component\"],[[28,[\"list\",\"vertical-collection\"]]],[[\"content\"],[[28,[\"model\"]]]],{\"statements\":[[0,\"    \"],[1,[33,[\"view-item\"],null,[[\"model\",\"inspect\",\"inspectElement\",\"sendModelToConsole\",\"sendObjectToConsole\",\"list\",\"index\",\"on-mouseenter\",\"on-mouseleave\"],[[28,[\"content\"]],[33,[\"action\"],[[28,[null]],\"inspect\"],null],[33,[\"action\"],[[28,[null]],\"inspectElement\"],null],[33,[\"action\"],[[28,[null]],\"sendModelToConsole\"],null],[33,[\"action\"],[[28,[null]],\"sendObjectToConsole\"],null],[28,[\"list\"]],[28,[\"index\"]],[33,[\"action\"],[[28,[null]],\"previewLayer\",[28,[\"content\"]]],null],[33,[\"action\"],[[28,[null]],\"hidePreview\"],null]]]],false],[0,\"\\n\"]],\"locals\":[\"content\",\"index\"]},null]],\"locals\":[\"list\"]},null]],\"locals\":[],\"named\":[],\"yields\":[],\"hasPartials\":false}", "meta": { "moduleName": "ember-inspector/templates/view-tree.hbs" } });
});
define('ember-inspector/utils/check-current-route', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (currentRouteName, routeName) {
    var regName = void 0,
        match = void 0;

    if (routeName === 'application') {
      return true;
    }

    regName = routeName.replace('.', '\\.');
    match = currentRouteName.match(new RegExp('(^|\\.)' + regName + '(\\.|$)'));
    if (match && match[0].match(/^\.[^.]+$/)) {
      match = false;
    }
    return !!match;
  };
});
define("ember-inspector/utils/compare-arrays", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (a, b) {
    if (a.length !== b.length) {
      return false;
    }
    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  };
});
define("ember-inspector/utils/escape-reg-exp", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  };
});
define("ember-inspector/utils/search-match", ["exports", "ember", "ember-inspector/utils/escape-reg-exp"], function (exports, _ember, _escapeRegExp) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (text, searchQuery) {
    if (isEmpty(searchQuery)) {
      return true;
    }
    var regExp = new RegExp((0, _escapeRegExp.default)(searchQuery.toLowerCase()));
    return !!text.toLowerCase().match(regExp);
  };

  var isEmpty = _ember.default.isEmpty;
});


define('ember-inspector/config/environment', ['ember'], function(Ember) {
  var prefix = 'ember-inspector';
try {
  var metaName = prefix + '/config/environment';
  var rawConfig = document.querySelector('meta[name="' + metaName + '"]').getAttribute('content');
  var config = JSON.parse(unescape(rawConfig));

  var exports = { 'default': config };

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

});

if (!runningTests) {
  require("ember-inspector/app")["default"].create({"name":"ember-inspector","version":"2.2.0"});
}
