(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){(function (){
/*!
 *  howler.js v2.2.1
 *  howlerjs.com
 *
 *  (c) 2013-2020, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */

(function() {

  'use strict';

  /** Global Methods **/
  /***************************************************************************/

  /**
   * Create the global controller. All contained methods and properties apply
   * to all sounds that are currently playing or will be in the future.
   */
  var HowlerGlobal = function() {
    this.init();
  };
  HowlerGlobal.prototype = {
    /**
     * Initialize the global Howler object.
     * @return {Howler}
     */
    init: function() {
      var self = this || Howler;

      // Create a global ID counter.
      self._counter = 1000;

      // Pool of unlocked HTML5 Audio objects.
      self._html5AudioPool = [];
      self.html5PoolSize = 10;

      // Internal properties.
      self._codecs = {};
      self._howls = [];
      self._muted = false;
      self._volume = 1;
      self._canPlayEvent = 'canplaythrough';
      self._navigator = (typeof window !== 'undefined' && window.navigator) ? window.navigator : null;

      // Public properties.
      self.masterGain = null;
      self.noAudio = false;
      self.usingWebAudio = true;
      self.autoSuspend = true;
      self.ctx = null;

      // Set to false to disable the auto audio unlocker.
      self.autoUnlock = true;

      // Setup the various state values for global tracking.
      self._setup();

      return self;
    },

    /**
     * Get/set the global volume for all sounds.
     * @param  {Float} vol Volume from 0.0 to 1.0.
     * @return {Howler/Float}     Returns self or current volume.
     */
    volume: function(vol) {
      var self = this || Howler;
      vol = parseFloat(vol);

      // If we don't have an AudioContext created yet, run the setup.
      if (!self.ctx) {
        setupAudioContext();
      }

      if (typeof vol !== 'undefined' && vol >= 0 && vol <= 1) {
        self._volume = vol;

        // Don't update any of the nodes if we are muted.
        if (self._muted) {
          return self;
        }

        // When using Web Audio, we just need to adjust the master gain.
        if (self.usingWebAudio) {
          self.masterGain.gain.setValueAtTime(vol, Howler.ctx.currentTime);
        }

        // Loop through and change volume for all HTML5 audio nodes.
        for (var i=0; i<self._howls.length; i++) {
          if (!self._howls[i]._webAudio) {
            // Get all of the sounds in this Howl group.
            var ids = self._howls[i]._getSoundIds();

            // Loop through all sounds and change the volumes.
            for (var j=0; j<ids.length; j++) {
              var sound = self._howls[i]._soundById(ids[j]);

              if (sound && sound._node) {
                sound._node.volume = sound._volume * vol;
              }
            }
          }
        }

        return self;
      }

      return self._volume;
    },

    /**
     * Handle muting and unmuting globally.
     * @param  {Boolean} muted Is muted or not.
     */
    mute: function(muted) {
      var self = this || Howler;

      // If we don't have an AudioContext created yet, run the setup.
      if (!self.ctx) {
        setupAudioContext();
      }

      self._muted = muted;

      // With Web Audio, we just need to mute the master gain.
      if (self.usingWebAudio) {
        self.masterGain.gain.setValueAtTime(muted ? 0 : self._volume, Howler.ctx.currentTime);
      }

      // Loop through and mute all HTML5 Audio nodes.
      for (var i=0; i<self._howls.length; i++) {
        if (!self._howls[i]._webAudio) {
          // Get all of the sounds in this Howl group.
          var ids = self._howls[i]._getSoundIds();

          // Loop through all sounds and mark the audio node as muted.
          for (var j=0; j<ids.length; j++) {
            var sound = self._howls[i]._soundById(ids[j]);

            if (sound && sound._node) {
              sound._node.muted = (muted) ? true : sound._muted;
            }
          }
        }
      }

      return self;
    },

    /**
     * Handle stopping all sounds globally.
     */
    stop: function() {
      var self = this || Howler;

      // Loop through all Howls and stop them.
      for (var i=0; i<self._howls.length; i++) {
        self._howls[i].stop();
      }

      return self;
    },

    /**
     * Unload and destroy all currently loaded Howl objects.
     * @return {Howler}
     */
    unload: function() {
      var self = this || Howler;

      for (var i=self._howls.length-1; i>=0; i--) {
        self._howls[i].unload();
      }

      // Create a new AudioContext to make sure it is fully reset.
      if (self.usingWebAudio && self.ctx && typeof self.ctx.close !== 'undefined') {
        self.ctx.close();
        self.ctx = null;
        setupAudioContext();
      }

      return self;
    },

    /**
     * Check for codec support of specific extension.
     * @param  {String} ext Audio file extention.
     * @return {Boolean}
     */
    codecs: function(ext) {
      return (this || Howler)._codecs[ext.replace(/^x-/, '')];
    },

    /**
     * Setup various state values for global tracking.
     * @return {Howler}
     */
    _setup: function() {
      var self = this || Howler;

      // Keeps track of the suspend/resume state of the AudioContext.
      self.state = self.ctx ? self.ctx.state || 'suspended' : 'suspended';

      // Automatically begin the 30-second suspend process
      self._autoSuspend();

      // Check if audio is available.
      if (!self.usingWebAudio) {
        // No audio is available on this system if noAudio is set to true.
        if (typeof Audio !== 'undefined') {
          try {
            var test = new Audio();

            // Check if the canplaythrough event is available.
            if (typeof test.oncanplaythrough === 'undefined') {
              self._canPlayEvent = 'canplay';
            }
          } catch(e) {
            self.noAudio = true;
          }
        } else {
          self.noAudio = true;
        }
      }

      // Test to make sure audio isn't disabled in Internet Explorer.
      try {
        var test = new Audio();
        if (test.muted) {
          self.noAudio = true;
        }
      } catch (e) {}

      // Check for supported codecs.
      if (!self.noAudio) {
        self._setupCodecs();
      }

      return self;
    },

    /**
     * Check for browser support for various codecs and cache the results.
     * @return {Howler}
     */
    _setupCodecs: function() {
      var self = this || Howler;
      var audioTest = null;

      // Must wrap in a try/catch because IE11 in server mode throws an error.
      try {
        audioTest = (typeof Audio !== 'undefined') ? new Audio() : null;
      } catch (err) {
        return self;
      }

      if (!audioTest || typeof audioTest.canPlayType !== 'function') {
        return self;
      }

      var mpegTest = audioTest.canPlayType('audio/mpeg;').replace(/^no$/, '');

      // Opera version <33 has mixed MP3 support, so we need to check for and block it.
      var checkOpera = self._navigator && self._navigator.userAgent.match(/OPR\/([0-6].)/g);
      var isOldOpera = (checkOpera && parseInt(checkOpera[0].split('/')[1], 10) < 33);

      self._codecs = {
        mp3: !!(!isOldOpera && (mpegTest || audioTest.canPlayType('audio/mp3;').replace(/^no$/, ''))),
        mpeg: !!mpegTest,
        opus: !!audioTest.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ''),
        ogg: !!audioTest.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
        oga: !!audioTest.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
        wav: !!(audioTest.canPlayType('audio/wav; codecs="1"') || audioTest.canPlayType('audio/wav')).replace(/^no$/, ''),
        aac: !!audioTest.canPlayType('audio/aac;').replace(/^no$/, ''),
        caf: !!audioTest.canPlayType('audio/x-caf;').replace(/^no$/, ''),
        m4a: !!(audioTest.canPlayType('audio/x-m4a;') || audioTest.canPlayType('audio/m4a;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
        m4b: !!(audioTest.canPlayType('audio/x-m4b;') || audioTest.canPlayType('audio/m4b;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
        mp4: !!(audioTest.canPlayType('audio/x-mp4;') || audioTest.canPlayType('audio/mp4;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
        weba: !!audioTest.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, ''),
        webm: !!audioTest.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, ''),
        dolby: !!audioTest.canPlayType('audio/mp4; codecs="ec-3"').replace(/^no$/, ''),
        flac: !!(audioTest.canPlayType('audio/x-flac;') || audioTest.canPlayType('audio/flac;')).replace(/^no$/, '')
      };

      return self;
    },

    /**
     * Some browsers/devices will only allow audio to be played after a user interaction.
     * Attempt to automatically unlock audio on the first user interaction.
     * Concept from: http://paulbakaus.com/tutorials/html5/web-audio-on-ios/
     * @return {Howler}
     */
    _unlockAudio: function() {
      var self = this || Howler;

      // Only run this if Web Audio is supported and it hasn't already been unlocked.
      if (self._audioUnlocked || !self.ctx) {
        return;
      }

      self._audioUnlocked = false;
      self.autoUnlock = false;

      // Some mobile devices/platforms have distortion issues when opening/closing tabs and/or web views.
      // Bugs in the browser (especially Mobile Safari) can cause the sampleRate to change from 44100 to 48000.
      // By calling Howler.unload(), we create a new AudioContext with the correct sampleRate.
      if (!self._mobileUnloaded && self.ctx.sampleRate !== 44100) {
        self._mobileUnloaded = true;
        self.unload();
      }

      // Scratch buffer for enabling iOS to dispose of web audio buffers correctly, as per:
      // http://stackoverflow.com/questions/24119684
      self._scratchBuffer = self.ctx.createBuffer(1, 1, 22050);

      // Call this method on touch start to create and play a buffer,
      // then check if the audio actually played to determine if
      // audio has now been unlocked on iOS, Android, etc.
      var unlock = function(e) {
        // Create a pool of unlocked HTML5 Audio objects that can
        // be used for playing sounds without user interaction. HTML5
        // Audio objects must be individually unlocked, as opposed
        // to the WebAudio API which only needs a single activation.
        // This must occur before WebAudio setup or the source.onended
        // event will not fire.
        while (self._html5AudioPool.length < self.html5PoolSize) {
          try {
            var audioNode = new Audio();

            // Mark this Audio object as unlocked to ensure it can get returned
            // to the unlocked pool when released.
            audioNode._unlocked = true;

            // Add the audio node to the pool.
            self._releaseHtml5Audio(audioNode);
          } catch (e) {
            self.noAudio = true;
            break;
          }
        }

        // Loop through any assigned audio nodes and unlock them.
        for (var i=0; i<self._howls.length; i++) {
          if (!self._howls[i]._webAudio) {
            // Get all of the sounds in this Howl group.
            var ids = self._howls[i]._getSoundIds();

            // Loop through all sounds and unlock the audio nodes.
            for (var j=0; j<ids.length; j++) {
              var sound = self._howls[i]._soundById(ids[j]);

              if (sound && sound._node && !sound._node._unlocked) {
                sound._node._unlocked = true;
                sound._node.load();
              }
            }
          }
        }

        // Fix Android can not play in suspend state.
        self._autoResume();

        // Create an empty buffer.
        var source = self.ctx.createBufferSource();
        source.buffer = self._scratchBuffer;
        source.connect(self.ctx.destination);

        // Play the empty buffer.
        if (typeof source.start === 'undefined') {
          source.noteOn(0);
        } else {
          source.start(0);
        }

        // Calling resume() on a stack initiated by user gesture is what actually unlocks the audio on Android Chrome >= 55.
        if (typeof self.ctx.resume === 'function') {
          self.ctx.resume();
        }

        // Setup a timeout to check that we are unlocked on the next event loop.
        source.onended = function() {
          source.disconnect(0);

          // Update the unlocked state and prevent this check from happening again.
          self._audioUnlocked = true;

          // Remove the touch start listener.
          document.removeEventListener('touchstart', unlock, true);
          document.removeEventListener('touchend', unlock, true);
          document.removeEventListener('click', unlock, true);

          // Let all sounds know that audio has been unlocked.
          for (var i=0; i<self._howls.length; i++) {
            self._howls[i]._emit('unlock');
          }
        };
      };

      // Setup a touch start listener to attempt an unlock in.
      document.addEventListener('touchstart', unlock, true);
      document.addEventListener('touchend', unlock, true);
      document.addEventListener('click', unlock, true);

      return self;
    },

    /**
     * Get an unlocked HTML5 Audio object from the pool. If none are left,
     * return a new Audio object and throw a warning.
     * @return {Audio} HTML5 Audio object.
     */
    _obtainHtml5Audio: function() {
      var self = this || Howler;

      // Return the next object from the pool if one exists.
      if (self._html5AudioPool.length) {
        return self._html5AudioPool.pop();
      }

      //.Check if the audio is locked and throw a warning.
      var testPlay = new Audio().play();
      if (testPlay && typeof Promise !== 'undefined' && (testPlay instanceof Promise || typeof testPlay.then === 'function')) {
        testPlay.catch(function() {
          console.warn('HTML5 Audio pool exhausted, returning potentially locked audio object.');
        });
      }

      return new Audio();
    },

    /**
     * Return an activated HTML5 Audio object to the pool.
     * @return {Howler}
     */
    _releaseHtml5Audio: function(audio) {
      var self = this || Howler;

      // Don't add audio to the pool if we don't know if it has been unlocked.
      if (audio._unlocked) {
        self._html5AudioPool.push(audio);
      }

      return self;
    },

    /**
     * Automatically suspend the Web Audio AudioContext after no sound has played for 30 seconds.
     * This saves processing/energy and fixes various browser-specific bugs with audio getting stuck.
     * @return {Howler}
     */
    _autoSuspend: function() {
      var self = this;

      if (!self.autoSuspend || !self.ctx || typeof self.ctx.suspend === 'undefined' || !Howler.usingWebAudio) {
        return;
      }

      // Check if any sounds are playing.
      for (var i=0; i<self._howls.length; i++) {
        if (self._howls[i]._webAudio) {
          for (var j=0; j<self._howls[i]._sounds.length; j++) {
            if (!self._howls[i]._sounds[j]._paused) {
              return self;
            }
          }
        }
      }

      if (self._suspendTimer) {
        clearTimeout(self._suspendTimer);
      }

      // If no sound has played after 30 seconds, suspend the context.
      self._suspendTimer = setTimeout(function() {
        if (!self.autoSuspend) {
          return;
        }

        self._suspendTimer = null;
        self.state = 'suspending';

        // Handle updating the state of the audio context after suspending.
        var handleSuspension = function() {
          self.state = 'suspended';

          if (self._resumeAfterSuspend) {
            delete self._resumeAfterSuspend;
            self._autoResume();
          }
        };

        // Either the state gets suspended or it is interrupted.
        // Either way, we need to update the state to suspended.
        self.ctx.suspend().then(handleSuspension, handleSuspension);
      }, 30000);

      return self;
    },

    /**
     * Automatically resume the Web Audio AudioContext when a new sound is played.
     * @return {Howler}
     */
    _autoResume: function() {
      var self = this;

      if (!self.ctx || typeof self.ctx.resume === 'undefined' || !Howler.usingWebAudio) {
        return;
      }

      if (self.state === 'running' && self.ctx.state !== 'interrupted' && self._suspendTimer) {
        clearTimeout(self._suspendTimer);
        self._suspendTimer = null;
      } else if (self.state === 'suspended' || self.state === 'running' && self.ctx.state === 'interrupted') {
        self.ctx.resume().then(function() {
          self.state = 'running';

          // Emit to all Howls that the audio has resumed.
          for (var i=0; i<self._howls.length; i++) {
            self._howls[i]._emit('resume');
          }
        });

        if (self._suspendTimer) {
          clearTimeout(self._suspendTimer);
          self._suspendTimer = null;
        }
      } else if (self.state === 'suspending') {
        self._resumeAfterSuspend = true;
      }

      return self;
    }
  };

  // Setup the global audio controller.
  var Howler = new HowlerGlobal();

  /** Group Methods **/
  /***************************************************************************/

  /**
   * Create an audio group controller.
   * @param {Object} o Passed in properties for this group.
   */
  var Howl = function(o) {
    var self = this;

    // Throw an error if no source is provided.
    if (!o.src || o.src.length === 0) {
      console.error('An array of source files must be passed with any new Howl.');
      return;
    }

    self.init(o);
  };
  Howl.prototype = {
    /**
     * Initialize a new Howl group object.
     * @param  {Object} o Passed in properties for this group.
     * @return {Howl}
     */
    init: function(o) {
      var self = this;

      // If we don't have an AudioContext created yet, run the setup.
      if (!Howler.ctx) {
        setupAudioContext();
      }

      // Setup user-defined default properties.
      self._autoplay = o.autoplay || false;
      self._format = (typeof o.format !== 'string') ? o.format : [o.format];
      self._html5 = o.html5 || false;
      self._muted = o.mute || false;
      self._loop = o.loop || false;
      self._pool = o.pool || 5;
      self._preload = (typeof o.preload === 'boolean' || o.preload === 'metadata') ? o.preload : true;
      self._rate = o.rate || 1;
      self._sprite = o.sprite || {};
      self._src = (typeof o.src !== 'string') ? o.src : [o.src];
      self._volume = o.volume !== undefined ? o.volume : 1;
      self._xhr = {
        method: o.xhr && o.xhr.method ? o.xhr.method : 'GET',
        headers: o.xhr && o.xhr.headers ? o.xhr.headers : null,
        withCredentials: o.xhr && o.xhr.withCredentials ? o.xhr.withCredentials : false,
      };

      // Setup all other default properties.
      self._duration = 0;
      self._state = 'unloaded';
      self._sounds = [];
      self._endTimers = {};
      self._queue = [];
      self._playLock = false;

      // Setup event listeners.
      self._onend = o.onend ? [{fn: o.onend}] : [];
      self._onfade = o.onfade ? [{fn: o.onfade}] : [];
      self._onload = o.onload ? [{fn: o.onload}] : [];
      self._onloaderror = o.onloaderror ? [{fn: o.onloaderror}] : [];
      self._onplayerror = o.onplayerror ? [{fn: o.onplayerror}] : [];
      self._onpause = o.onpause ? [{fn: o.onpause}] : [];
      self._onplay = o.onplay ? [{fn: o.onplay}] : [];
      self._onstop = o.onstop ? [{fn: o.onstop}] : [];
      self._onmute = o.onmute ? [{fn: o.onmute}] : [];
      self._onvolume = o.onvolume ? [{fn: o.onvolume}] : [];
      self._onrate = o.onrate ? [{fn: o.onrate}] : [];
      self._onseek = o.onseek ? [{fn: o.onseek}] : [];
      self._onunlock = o.onunlock ? [{fn: o.onunlock}] : [];
      self._onresume = [];

      // Web Audio or HTML5 Audio?
      self._webAudio = Howler.usingWebAudio && !self._html5;

      // Automatically try to enable audio.
      if (typeof Howler.ctx !== 'undefined' && Howler.ctx && Howler.autoUnlock) {
        Howler._unlockAudio();
      }

      // Keep track of this Howl group in the global controller.
      Howler._howls.push(self);

      // If they selected autoplay, add a play event to the load queue.
      if (self._autoplay) {
        self._queue.push({
          event: 'play',
          action: function() {
            self.play();
          }
        });
      }

      // Load the source file unless otherwise specified.
      if (self._preload && self._preload !== 'none') {
        self.load();
      }

      return self;
    },

    /**
     * Load the audio file.
     * @return {Howler}
     */
    load: function() {
      var self = this;
      var url = null;

      // If no audio is available, quit immediately.
      if (Howler.noAudio) {
        self._emit('loaderror', null, 'No audio support.');
        return;
      }

      // Make sure our source is in an array.
      if (typeof self._src === 'string') {
        self._src = [self._src];
      }

      // Loop through the sources and pick the first one that is compatible.
      for (var i=0; i<self._src.length; i++) {
        var ext, str;

        if (self._format && self._format[i]) {
          // If an extension was specified, use that instead.
          ext = self._format[i];
        } else {
          // Make sure the source is a string.
          str = self._src[i];
          if (typeof str !== 'string') {
            self._emit('loaderror', null, 'Non-string found in selected audio sources - ignoring.');
            continue;
          }

          // Extract the file extension from the URL or base64 data URI.
          ext = /^data:audio\/([^;,]+);/i.exec(str);
          if (!ext) {
            ext = /\.([^.]+)$/.exec(str.split('?', 1)[0]);
          }

          if (ext) {
            ext = ext[1].toLowerCase();
          }
        }

        // Log a warning if no extension was found.
        if (!ext) {
          console.warn('No file extension was found. Consider using the "format" property or specify an extension.');
        }

        // Check if this extension is available.
        if (ext && Howler.codecs(ext)) {
          url = self._src[i];
          break;
        }
      }

      if (!url) {
        self._emit('loaderror', null, 'No codec support for selected audio sources.');
        return;
      }

      self._src = url;
      self._state = 'loading';

      // If the hosting page is HTTPS and the source isn't,
      // drop down to HTML5 Audio to avoid Mixed Content errors.
      if (window.location.protocol === 'https:' && url.slice(0, 5) === 'http:') {
        self._html5 = true;
        self._webAudio = false;
      }

      // Create a new sound object and add it to the pool.
      new Sound(self);

      // Load and decode the audio data for playback.
      if (self._webAudio) {
        loadBuffer(self);
      }

      return self;
    },

    /**
     * Play a sound or resume previous playback.
     * @param  {String/Number} sprite   Sprite name for sprite playback or sound id to continue previous.
     * @param  {Boolean} internal Internal Use: true prevents event firing.
     * @return {Number}          Sound ID.
     */
    play: function(sprite, internal) {
      var self = this;
      var id = null;

      // Determine if a sprite, sound id or nothing was passed
      if (typeof sprite === 'number') {
        id = sprite;
        sprite = null;
      } else if (typeof sprite === 'string' && self._state === 'loaded' && !self._sprite[sprite]) {
        // If the passed sprite doesn't exist, do nothing.
        return null;
      } else if (typeof sprite === 'undefined') {
        // Use the default sound sprite (plays the full audio length).
        sprite = '__default';

        // Check if there is a single paused sound that isn't ended.
        // If there is, play that sound. If not, continue as usual.
        if (!self._playLock) {
          var num = 0;
          for (var i=0; i<self._sounds.length; i++) {
            if (self._sounds[i]._paused && !self._sounds[i]._ended) {
              num++;
              id = self._sounds[i]._id;
            }
          }

          if (num === 1) {
            sprite = null;
          } else {
            id = null;
          }
        }
      }

      // Get the selected node, or get one from the pool.
      var sound = id ? self._soundById(id) : self._inactiveSound();

      // If the sound doesn't exist, do nothing.
      if (!sound) {
        return null;
      }

      // Select the sprite definition.
      if (id && !sprite) {
        sprite = sound._sprite || '__default';
      }

      // If the sound hasn't loaded, we must wait to get the audio's duration.
      // We also need to wait to make sure we don't run into race conditions with
      // the order of function calls.
      if (self._state !== 'loaded') {
        // Set the sprite value on this sound.
        sound._sprite = sprite;

        // Mark this sound as not ended in case another sound is played before this one loads.
        sound._ended = false;

        // Add the sound to the queue to be played on load.
        var soundId = sound._id;
        self._queue.push({
          event: 'play',
          action: function() {
            self.play(soundId);
          }
        });

        return soundId;
      }

      // Don't play the sound if an id was passed and it is already playing.
      if (id && !sound._paused) {
        // Trigger the play event, in order to keep iterating through queue.
        if (!internal) {
          self._loadQueue('play');
        }

        return sound._id;
      }

      // Make sure the AudioContext isn't suspended, and resume it if it is.
      if (self._webAudio) {
        Howler._autoResume();
      }

      // Determine how long to play for and where to start playing.
      var seek = Math.max(0, sound._seek > 0 ? sound._seek : self._sprite[sprite][0] / 1000);
      var duration = Math.max(0, ((self._sprite[sprite][0] + self._sprite[sprite][1]) / 1000) - seek);
      var timeout = (duration * 1000) / Math.abs(sound._rate);
      var start = self._sprite[sprite][0] / 1000;
      var stop = (self._sprite[sprite][0] + self._sprite[sprite][1]) / 1000;
      sound._sprite = sprite;

      // Mark the sound as ended instantly so that this async playback
      // doesn't get grabbed by another call to play while this one waits to start.
      sound._ended = false;

      // Update the parameters of the sound.
      var setParams = function() {
        sound._paused = false;
        sound._seek = seek;
        sound._start = start;
        sound._stop = stop;
        sound._loop = !!(sound._loop || self._sprite[sprite][2]);
      };

      // End the sound instantly if seek is at the end.
      if (seek >= stop) {
        self._ended(sound);
        return;
      }

      // Begin the actual playback.
      var node = sound._node;
      if (self._webAudio) {
        // Fire this when the sound is ready to play to begin Web Audio playback.
        var playWebAudio = function() {
          self._playLock = false;
          setParams();
          self._refreshBuffer(sound);

          // Setup the playback params.
          var vol = (sound._muted || self._muted) ? 0 : sound._volume;
          node.gain.setValueAtTime(vol, Howler.ctx.currentTime);
          sound._playStart = Howler.ctx.currentTime;

          // Play the sound using the supported method.
          if (typeof node.bufferSource.start === 'undefined') {
            sound._loop ? node.bufferSource.noteGrainOn(0, seek, 86400) : node.bufferSource.noteGrainOn(0, seek, duration);
          } else {
            sound._loop ? node.bufferSource.start(0, seek, 86400) : node.bufferSource.start(0, seek, duration);
          }

          // Start a new timer if none is present.
          if (timeout !== Infinity) {
            self._endTimers[sound._id] = setTimeout(self._ended.bind(self, sound), timeout);
          }

          if (!internal) {
            setTimeout(function() {
              self._emit('play', sound._id);
              self._loadQueue();
            }, 0);
          }
        };

        if (Howler.state === 'running' && Howler.ctx.state !== 'interrupted') {
          playWebAudio();
        } else {
          self._playLock = true;

          // Wait for the audio context to resume before playing.
          self.once('resume', playWebAudio);

          // Cancel the end timer.
          self._clearTimer(sound._id);
        }
      } else {
        // Fire this when the sound is ready to play to begin HTML5 Audio playback.
        var playHtml5 = function() {
          node.currentTime = seek;
          node.muted = sound._muted || self._muted || Howler._muted || node.muted;
          node.volume = sound._volume * Howler.volume();
          node.playbackRate = sound._rate;

          // Some browsers will throw an error if this is called without user interaction.
          try {
            var play = node.play();

            // Support older browsers that don't support promises, and thus don't have this issue.
            if (play && typeof Promise !== 'undefined' && (play instanceof Promise || typeof play.then === 'function')) {
              // Implements a lock to prevent DOMException: The play() request was interrupted by a call to pause().
              self._playLock = true;

              // Set param values immediately.
              setParams();

              // Releases the lock and executes queued actions.
              play
                .then(function() {
                  self._playLock = false;
                  node._unlocked = true;
                  if (!internal) {
                    self._emit('play', sound._id);
                    self._loadQueue();
                  }
                })
                .catch(function() {
                  self._playLock = false;
                  self._emit('playerror', sound._id, 'Playback was unable to start. This is most commonly an issue ' +
                    'on mobile devices and Chrome where playback was not within a user interaction.');

                  // Reset the ended and paused values.
                  sound._ended = true;
                  sound._paused = true;
                });
            } else if (!internal) {
              self._playLock = false;
              setParams();
              self._emit('play', sound._id);
              self._loadQueue();
            }

            // Setting rate before playing won't work in IE, so we set it again here.
            node.playbackRate = sound._rate;

            // If the node is still paused, then we can assume there was a playback issue.
            if (node.paused) {
              self._emit('playerror', sound._id, 'Playback was unable to start. This is most commonly an issue ' +
                'on mobile devices and Chrome where playback was not within a user interaction.');
              return;
            }

            // Setup the end timer on sprites or listen for the ended event.
            if (sprite !== '__default' || sound._loop) {
              self._endTimers[sound._id] = setTimeout(self._ended.bind(self, sound), timeout);
            } else {
              self._endTimers[sound._id] = function() {
                // Fire ended on this audio node.
                self._ended(sound);

                // Clear this listener.
                node.removeEventListener('ended', self._endTimers[sound._id], false);
              };
              node.addEventListener('ended', self._endTimers[sound._id], false);
            }
          } catch (err) {
            self._emit('playerror', sound._id, err);
          }
        };

        // If this is streaming audio, make sure the src is set and load again.
        if (node.src === 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA') {
          node.src = self._src;
          node.load();
        }

        // Play immediately if ready, or wait for the 'canplaythrough'e vent.
        var loadedNoReadyState = (window && window.ejecta) || (!node.readyState && Howler._navigator.isCocoonJS);
        if (node.readyState >= 3 || loadedNoReadyState) {
          playHtml5();
        } else {
          self._playLock = true;

          var listener = function() {
            // Begin playback.
            playHtml5();

            // Clear this listener.
            node.removeEventListener(Howler._canPlayEvent, listener, false);
          };
          node.addEventListener(Howler._canPlayEvent, listener, false);

          // Cancel the end timer.
          self._clearTimer(sound._id);
        }
      }

      return sound._id;
    },

    /**
     * Pause playback and save current position.
     * @param  {Number} id The sound ID (empty to pause all in group).
     * @return {Howl}
     */
    pause: function(id) {
      var self = this;

      // If the sound hasn't loaded or a play() promise is pending, add it to the load queue to pause when capable.
      if (self._state !== 'loaded' || self._playLock) {
        self._queue.push({
          event: 'pause',
          action: function() {
            self.pause(id);
          }
        });

        return self;
      }

      // If no id is passed, get all ID's to be paused.
      var ids = self._getSoundIds(id);

      for (var i=0; i<ids.length; i++) {
        // Clear the end timer.
        self._clearTimer(ids[i]);

        // Get the sound.
        var sound = self._soundById(ids[i]);

        if (sound && !sound._paused) {
          // Reset the seek position.
          sound._seek = self.seek(ids[i]);
          sound._rateSeek = 0;
          sound._paused = true;

          // Stop currently running fades.
          self._stopFade(ids[i]);

          if (sound._node) {
            if (self._webAudio) {
              // Make sure the sound has been created.
              if (!sound._node.bufferSource) {
                continue;
              }

              if (typeof sound._node.bufferSource.stop === 'undefined') {
                sound._node.bufferSource.noteOff(0);
              } else {
                sound._node.bufferSource.stop(0);
              }

              // Clean up the buffer source.
              self._cleanBuffer(sound._node);
            } else if (!isNaN(sound._node.duration) || sound._node.duration === Infinity) {
              sound._node.pause();
            }
          }
        }

        // Fire the pause event, unless `true` is passed as the 2nd argument.
        if (!arguments[1]) {
          self._emit('pause', sound ? sound._id : null);
        }
      }

      return self;
    },

    /**
     * Stop playback and reset to start.
     * @param  {Number} id The sound ID (empty to stop all in group).
     * @param  {Boolean} internal Internal Use: true prevents event firing.
     * @return {Howl}
     */
    stop: function(id, internal) {
      var self = this;

      // If the sound hasn't loaded, add it to the load queue to stop when capable.
      if (self._state !== 'loaded' || self._playLock) {
        self._queue.push({
          event: 'stop',
          action: function() {
            self.stop(id);
          }
        });

        return self;
      }

      // If no id is passed, get all ID's to be stopped.
      var ids = self._getSoundIds(id);

      for (var i=0; i<ids.length; i++) {
        // Clear the end timer.
        self._clearTimer(ids[i]);

        // Get the sound.
        var sound = self._soundById(ids[i]);

        if (sound) {
          // Reset the seek position.
          sound._seek = sound._start || 0;
          sound._rateSeek = 0;
          sound._paused = true;
          sound._ended = true;

          // Stop currently running fades.
          self._stopFade(ids[i]);

          if (sound._node) {
            if (self._webAudio) {
              // Make sure the sound's AudioBufferSourceNode has been created.
              if (sound._node.bufferSource) {
                if (typeof sound._node.bufferSource.stop === 'undefined') {
                  sound._node.bufferSource.noteOff(0);
                } else {
                  sound._node.bufferSource.stop(0);
                }

                // Clean up the buffer source.
                self._cleanBuffer(sound._node);
              }
            } else if (!isNaN(sound._node.duration) || sound._node.duration === Infinity) {
              sound._node.currentTime = sound._start || 0;
              sound._node.pause();

              // If this is a live stream, stop download once the audio is stopped.
              if (sound._node.duration === Infinity) {
                self._clearSound(sound._node);
              }
            }
          }

          if (!internal) {
            self._emit('stop', sound._id);
          }
        }
      }

      return self;
    },

    /**
     * Mute/unmute a single sound or all sounds in this Howl group.
     * @param  {Boolean} muted Set to true to mute and false to unmute.
     * @param  {Number} id    The sound ID to update (omit to mute/unmute all).
     * @return {Howl}
     */
    mute: function(muted, id) {
      var self = this;

      // If the sound hasn't loaded, add it to the load queue to mute when capable.
      if (self._state !== 'loaded'|| self._playLock) {
        self._queue.push({
          event: 'mute',
          action: function() {
            self.mute(muted, id);
          }
        });

        return self;
      }

      // If applying mute/unmute to all sounds, update the group's value.
      if (typeof id === 'undefined') {
        if (typeof muted === 'boolean') {
          self._muted = muted;
        } else {
          return self._muted;
        }
      }

      // If no id is passed, get all ID's to be muted.
      var ids = self._getSoundIds(id);

      for (var i=0; i<ids.length; i++) {
        // Get the sound.
        var sound = self._soundById(ids[i]);

        if (sound) {
          sound._muted = muted;

          // Cancel active fade and set the volume to the end value.
          if (sound._interval) {
            self._stopFade(sound._id);
          }

          if (self._webAudio && sound._node) {
            sound._node.gain.setValueAtTime(muted ? 0 : sound._volume, Howler.ctx.currentTime);
          } else if (sound._node) {
            sound._node.muted = Howler._muted ? true : muted;
          }

          self._emit('mute', sound._id);
        }
      }

      return self;
    },

    /**
     * Get/set the volume of this sound or of the Howl group. This method can optionally take 0, 1 or 2 arguments.
     *   volume() -> Returns the group's volume value.
     *   volume(id) -> Returns the sound id's current volume.
     *   volume(vol) -> Sets the volume of all sounds in this Howl group.
     *   volume(vol, id) -> Sets the volume of passed sound id.
     * @return {Howl/Number} Returns self or current volume.
     */
    volume: function() {
      var self = this;
      var args = arguments;
      var vol, id;

      // Determine the values based on arguments.
      if (args.length === 0) {
        // Return the value of the groups' volume.
        return self._volume;
      } else if (args.length === 1 || args.length === 2 && typeof args[1] === 'undefined') {
        // First check if this is an ID, and if not, assume it is a new volume.
        var ids = self._getSoundIds();
        var index = ids.indexOf(args[0]);
        if (index >= 0) {
          id = parseInt(args[0], 10);
        } else {
          vol = parseFloat(args[0]);
        }
      } else if (args.length >= 2) {
        vol = parseFloat(args[0]);
        id = parseInt(args[1], 10);
      }

      // Update the volume or return the current volume.
      var sound;
      if (typeof vol !== 'undefined' && vol >= 0 && vol <= 1) {
        // If the sound hasn't loaded, add it to the load queue to change volume when capable.
        if (self._state !== 'loaded'|| self._playLock) {
          self._queue.push({
            event: 'volume',
            action: function() {
              self.volume.apply(self, args);
            }
          });

          return self;
        }

        // Set the group volume.
        if (typeof id === 'undefined') {
          self._volume = vol;
        }

        // Update one or all volumes.
        id = self._getSoundIds(id);
        for (var i=0; i<id.length; i++) {
          // Get the sound.
          sound = self._soundById(id[i]);

          if (sound) {
            sound._volume = vol;

            // Stop currently running fades.
            if (!args[2]) {
              self._stopFade(id[i]);
            }

            if (self._webAudio && sound._node && !sound._muted) {
              sound._node.gain.setValueAtTime(vol, Howler.ctx.currentTime);
            } else if (sound._node && !sound._muted) {
              sound._node.volume = vol * Howler.volume();
            }

            self._emit('volume', sound._id);
          }
        }
      } else {
        sound = id ? self._soundById(id) : self._sounds[0];
        return sound ? sound._volume : 0;
      }

      return self;
    },

    /**
     * Fade a currently playing sound between two volumes (if no id is passed, all sounds will fade).
     * @param  {Number} from The value to fade from (0.0 to 1.0).
     * @param  {Number} to   The volume to fade to (0.0 to 1.0).
     * @param  {Number} len  Time in milliseconds to fade.
     * @param  {Number} id   The sound id (omit to fade all sounds).
     * @return {Howl}
     */
    fade: function(from, to, len, id) {
      var self = this;

      // If the sound hasn't loaded, add it to the load queue to fade when capable.
      if (self._state !== 'loaded' || self._playLock) {
        self._queue.push({
          event: 'fade',
          action: function() {
            self.fade(from, to, len, id);
          }
        });

        return self;
      }

      // Make sure the to/from/len values are numbers.
      from = Math.min(Math.max(0, parseFloat(from)), 1);
      to = Math.min(Math.max(0, parseFloat(to)), 1);
      len = parseFloat(len);

      // Set the volume to the start position.
      self.volume(from, id);

      // Fade the volume of one or all sounds.
      var ids = self._getSoundIds(id);
      for (var i=0; i<ids.length; i++) {
        // Get the sound.
        var sound = self._soundById(ids[i]);

        // Create a linear fade or fall back to timeouts with HTML5 Audio.
        if (sound) {
          // Stop the previous fade if no sprite is being used (otherwise, volume handles this).
          if (!id) {
            self._stopFade(ids[i]);
          }

          // If we are using Web Audio, let the native methods do the actual fade.
          if (self._webAudio && !sound._muted) {
            var currentTime = Howler.ctx.currentTime;
            var end = currentTime + (len / 1000);
            sound._volume = from;
            sound._node.gain.setValueAtTime(from, currentTime);
            sound._node.gain.linearRampToValueAtTime(to, end);
          }

          self._startFadeInterval(sound, from, to, len, ids[i], typeof id === 'undefined');
        }
      }

      return self;
    },

    /**
     * Starts the internal interval to fade a sound.
     * @param  {Object} sound Reference to sound to fade.
     * @param  {Number} from The value to fade from (0.0 to 1.0).
     * @param  {Number} to   The volume to fade to (0.0 to 1.0).
     * @param  {Number} len  Time in milliseconds to fade.
     * @param  {Number} id   The sound id to fade.
     * @param  {Boolean} isGroup   If true, set the volume on the group.
     */
    _startFadeInterval: function(sound, from, to, len, id, isGroup) {
      var self = this;
      var vol = from;
      var diff = to - from;
      var steps = Math.abs(diff / 0.01);
      var stepLen = Math.max(4, (steps > 0) ? len / steps : len);
      var lastTick = Date.now();

      // Store the value being faded to.
      sound._fadeTo = to;

      // Update the volume value on each interval tick.
      sound._interval = setInterval(function() {
        // Update the volume based on the time since the last tick.
        var tick = (Date.now() - lastTick) / len;
        lastTick = Date.now();
        vol += diff * tick;

        // Round to within 2 decimal points.
        vol = Math.round(vol * 100) / 100;

        // Make sure the volume is in the right bounds.
        if (diff < 0) {
          vol = Math.max(to, vol);
        } else {
          vol = Math.min(to, vol);
        }

        // Change the volume.
        if (self._webAudio) {
          sound._volume = vol;
        } else {
          self.volume(vol, sound._id, true);
        }

        // Set the group's volume.
        if (isGroup) {
          self._volume = vol;
        }

        // When the fade is complete, stop it and fire event.
        if ((to < from && vol <= to) || (to > from && vol >= to)) {
          clearInterval(sound._interval);
          sound._interval = null;
          sound._fadeTo = null;
          self.volume(to, sound._id);
          self._emit('fade', sound._id);
        }
      }, stepLen);
    },

    /**
     * Internal method that stops the currently playing fade when
     * a new fade starts, volume is changed or the sound is stopped.
     * @param  {Number} id The sound id.
     * @return {Howl}
     */
    _stopFade: function(id) {
      var self = this;
      var sound = self._soundById(id);

      if (sound && sound._interval) {
        if (self._webAudio) {
          sound._node.gain.cancelScheduledValues(Howler.ctx.currentTime);
        }

        clearInterval(sound._interval);
        sound._interval = null;
        self.volume(sound._fadeTo, id);
        sound._fadeTo = null;
        self._emit('fade', id);
      }

      return self;
    },

    /**
     * Get/set the loop parameter on a sound. This method can optionally take 0, 1 or 2 arguments.
     *   loop() -> Returns the group's loop value.
     *   loop(id) -> Returns the sound id's loop value.
     *   loop(loop) -> Sets the loop value for all sounds in this Howl group.
     *   loop(loop, id) -> Sets the loop value of passed sound id.
     * @return {Howl/Boolean} Returns self or current loop value.
     */
    loop: function() {
      var self = this;
      var args = arguments;
      var loop, id, sound;

      // Determine the values for loop and id.
      if (args.length === 0) {
        // Return the grou's loop value.
        return self._loop;
      } else if (args.length === 1) {
        if (typeof args[0] === 'boolean') {
          loop = args[0];
          self._loop = loop;
        } else {
          // Return this sound's loop value.
          sound = self._soundById(parseInt(args[0], 10));
          return sound ? sound._loop : false;
        }
      } else if (args.length === 2) {
        loop = args[0];
        id = parseInt(args[1], 10);
      }

      // If no id is passed, get all ID's to be looped.
      var ids = self._getSoundIds(id);
      for (var i=0; i<ids.length; i++) {
        sound = self._soundById(ids[i]);

        if (sound) {
          sound._loop = loop;
          if (self._webAudio && sound._node && sound._node.bufferSource) {
            sound._node.bufferSource.loop = loop;
            if (loop) {
              sound._node.bufferSource.loopStart = sound._start || 0;
              sound._node.bufferSource.loopEnd = sound._stop;
            }
          }
        }
      }

      return self;
    },

    /**
     * Get/set the playback rate of a sound. This method can optionally take 0, 1 or 2 arguments.
     *   rate() -> Returns the first sound node's current playback rate.
     *   rate(id) -> Returns the sound id's current playback rate.
     *   rate(rate) -> Sets the playback rate of all sounds in this Howl group.
     *   rate(rate, id) -> Sets the playback rate of passed sound id.
     * @return {Howl/Number} Returns self or the current playback rate.
     */
    rate: function() {
      var self = this;
      var args = arguments;
      var rate, id;

      // Determine the values based on arguments.
      if (args.length === 0) {
        // We will simply return the current rate of the first node.
        id = self._sounds[0]._id;
      } else if (args.length === 1) {
        // First check if this is an ID, and if not, assume it is a new rate value.
        var ids = self._getSoundIds();
        var index = ids.indexOf(args[0]);
        if (index >= 0) {
          id = parseInt(args[0], 10);
        } else {
          rate = parseFloat(args[0]);
        }
      } else if (args.length === 2) {
        rate = parseFloat(args[0]);
        id = parseInt(args[1], 10);
      }

      // Update the playback rate or return the current value.
      var sound;
      if (typeof rate === 'number') {
        // If the sound hasn't loaded, add it to the load queue to change playback rate when capable.
        if (self._state !== 'loaded' || self._playLock) {
          self._queue.push({
            event: 'rate',
            action: function() {
              self.rate.apply(self, args);
            }
          });

          return self;
        }

        // Set the group rate.
        if (typeof id === 'undefined') {
          self._rate = rate;
        }

        // Update one or all volumes.
        id = self._getSoundIds(id);
        for (var i=0; i<id.length; i++) {
          // Get the sound.
          sound = self._soundById(id[i]);

          if (sound) {
            // Keep track of our position when the rate changed and update the playback
            // start position so we can properly adjust the seek position for time elapsed.
            if (self.playing(id[i])) {
              sound._rateSeek = self.seek(id[i]);
              sound._playStart = self._webAudio ? Howler.ctx.currentTime : sound._playStart;
            }
            sound._rate = rate;

            // Change the playback rate.
            if (self._webAudio && sound._node && sound._node.bufferSource) {
              sound._node.bufferSource.playbackRate.setValueAtTime(rate, Howler.ctx.currentTime);
            } else if (sound._node) {
              sound._node.playbackRate = rate;
            }

            // Reset the timers.
            var seek = self.seek(id[i]);
            var duration = ((self._sprite[sound._sprite][0] + self._sprite[sound._sprite][1]) / 1000) - seek;
            var timeout = (duration * 1000) / Math.abs(sound._rate);

            // Start a new end timer if sound is already playing.
            if (self._endTimers[id[i]] || !sound._paused) {
              self._clearTimer(id[i]);
              self._endTimers[id[i]] = setTimeout(self._ended.bind(self, sound), timeout);
            }

            self._emit('rate', sound._id);
          }
        }
      } else {
        sound = self._soundById(id);
        return sound ? sound._rate : self._rate;
      }

      return self;
    },

    /**
     * Get/set the seek position of a sound. This method can optionally take 0, 1 or 2 arguments.
     *   seek() -> Returns the first sound node's current seek position.
     *   seek(id) -> Returns the sound id's current seek position.
     *   seek(seek) -> Sets the seek position of the first sound node.
     *   seek(seek, id) -> Sets the seek position of passed sound id.
     * @return {Howl/Number} Returns self or the current seek position.
     */
    seek: function() {
      var self = this;
      var args = arguments;
      var seek, id;

      // Determine the values based on arguments.
      if (args.length === 0) {
        // We will simply return the current position of the first node.
        id = self._sounds[0]._id;
      } else if (args.length === 1) {
        // First check if this is an ID, and if not, assume it is a new seek position.
        var ids = self._getSoundIds();
        var index = ids.indexOf(args[0]);
        if (index >= 0) {
          id = parseInt(args[0], 10);
        } else if (self._sounds.length) {
          id = self._sounds[0]._id;
          seek = parseFloat(args[0]);
        }
      } else if (args.length === 2) {
        seek = parseFloat(args[0]);
        id = parseInt(args[1], 10);
      }

      // If there is no ID, bail out.
      if (typeof id === 'undefined') {
        return self;
      }

      // If the sound hasn't loaded, add it to the load queue to seek when capable.
      if (typeof seek === 'number' && (self._state !== 'loaded' || self._playLock)) {
        self._queue.push({
          event: 'seek',
          action: function() {
            self.seek.apply(self, args);
          }
        });

        return self;
      }

      // Get the sound.
      var sound = self._soundById(id);

      if (sound) {
        if (typeof seek === 'number' && seek >= 0) {
          // Pause the sound and update position for restarting playback.
          var playing = self.playing(id);
          if (playing) {
            self.pause(id, true);
          }

          // Move the position of the track and cancel timer.
          sound._seek = seek;
          sound._ended = false;
          self._clearTimer(id);

          // Update the seek position for HTML5 Audio.
          if (!self._webAudio && sound._node && !isNaN(sound._node.duration)) {
            sound._node.currentTime = seek;
          }

          // Seek and emit when ready.
          var seekAndEmit = function() {
            self._emit('seek', id);

            // Restart the playback if the sound was playing.
            if (playing) {
              self.play(id, true);
            }
          };

          // Wait for the play lock to be unset before emitting (HTML5 Audio).
          if (playing && !self._webAudio) {
            var emitSeek = function() {
              if (!self._playLock) {
                seekAndEmit();
              } else {
                setTimeout(emitSeek, 0);
              }
            };
            setTimeout(emitSeek, 0);
          } else {
            seekAndEmit();
          }
        } else {
          if (self._webAudio) {
            var realTime = self.playing(id) ? Howler.ctx.currentTime - sound._playStart : 0;
            var rateSeek = sound._rateSeek ? sound._rateSeek - sound._seek : 0;
            return sound._seek + (rateSeek + realTime * Math.abs(sound._rate));
          } else {
            return sound._node.currentTime;
          }
        }
      }

      return self;
    },

    /**
     * Check if a specific sound is currently playing or not (if id is provided), or check if at least one of the sounds in the group is playing or not.
     * @param  {Number}  id The sound id to check. If none is passed, the whole sound group is checked.
     * @return {Boolean} True if playing and false if not.
     */
    playing: function(id) {
      var self = this;

      // Check the passed sound ID (if any).
      if (typeof id === 'number') {
        var sound = self._soundById(id);
        return sound ? !sound._paused : false;
      }

      // Otherwise, loop through all sounds and check if any are playing.
      for (var i=0; i<self._sounds.length; i++) {
        if (!self._sounds[i]._paused) {
          return true;
        }
      }

      return false;
    },

    /**
     * Get the duration of this sound. Passing a sound id will return the sprite duration.
     * @param  {Number} id The sound id to check. If none is passed, return full source duration.
     * @return {Number} Audio duration in seconds.
     */
    duration: function(id) {
      var self = this;
      var duration = self._duration;

      // If we pass an ID, get the sound and return the sprite length.
      var sound = self._soundById(id);
      if (sound) {
        duration = self._sprite[sound._sprite][1] / 1000;
      }

      return duration;
    },

    /**
     * Returns the current loaded state of this Howl.
     * @return {String} 'unloaded', 'loading', 'loaded'
     */
    state: function() {
      return this._state;
    },

    /**
     * Unload and destroy the current Howl object.
     * This will immediately stop all sound instances attached to this group.
     */
    unload: function() {
      var self = this;

      // Stop playing any active sounds.
      var sounds = self._sounds;
      for (var i=0; i<sounds.length; i++) {
        // Stop the sound if it is currently playing.
        if (!sounds[i]._paused) {
          self.stop(sounds[i]._id);
        }

        // Remove the source or disconnect.
        if (!self._webAudio) {
          // Set the source to 0-second silence to stop any downloading (except in IE).
          self._clearSound(sounds[i]._node);

          // Remove any event listeners.
          sounds[i]._node.removeEventListener('error', sounds[i]._errorFn, false);
          sounds[i]._node.removeEventListener(Howler._canPlayEvent, sounds[i]._loadFn, false);
          sounds[i]._node.removeEventListener('ended', sounds[i]._endFn, false);

          // Release the Audio object back to the pool.
          Howler._releaseHtml5Audio(sounds[i]._node);
        }

        // Empty out all of the nodes.
        delete sounds[i]._node;

        // Make sure all timers are cleared out.
        self._clearTimer(sounds[i]._id);
      }

      // Remove the references in the global Howler object.
      var index = Howler._howls.indexOf(self);
      if (index >= 0) {
        Howler._howls.splice(index, 1);
      }

      // Delete this sound from the cache (if no other Howl is using it).
      var remCache = true;
      for (i=0; i<Howler._howls.length; i++) {
        if (Howler._howls[i]._src === self._src || self._src.indexOf(Howler._howls[i]._src) >= 0) {
          remCache = false;
          break;
        }
      }

      if (cache && remCache) {
        delete cache[self._src];
      }

      // Clear global errors.
      Howler.noAudio = false;

      // Clear out `self`.
      self._state = 'unloaded';
      self._sounds = [];
      self = null;

      return null;
    },

    /**
     * Listen to a custom event.
     * @param  {String}   event Event name.
     * @param  {Function} fn    Listener to call.
     * @param  {Number}   id    (optional) Only listen to events for this sound.
     * @param  {Number}   once  (INTERNAL) Marks event to fire only once.
     * @return {Howl}
     */
    on: function(event, fn, id, once) {
      var self = this;
      var events = self['_on' + event];

      if (typeof fn === 'function') {
        events.push(once ? {id: id, fn: fn, once: once} : {id: id, fn: fn});
      }

      return self;
    },

    /**
     * Remove a custom event. Call without parameters to remove all events.
     * @param  {String}   event Event name.
     * @param  {Function} fn    Listener to remove. Leave empty to remove all.
     * @param  {Number}   id    (optional) Only remove events for this sound.
     * @return {Howl}
     */
    off: function(event, fn, id) {
      var self = this;
      var events = self['_on' + event];
      var i = 0;

      // Allow passing just an event and ID.
      if (typeof fn === 'number') {
        id = fn;
        fn = null;
      }

      if (fn || id) {
        // Loop through event store and remove the passed function.
        for (i=0; i<events.length; i++) {
          var isId = (id === events[i].id);
          if (fn === events[i].fn && isId || !fn && isId) {
            events.splice(i, 1);
            break;
          }
        }
      } else if (event) {
        // Clear out all events of this type.
        self['_on' + event] = [];
      } else {
        // Clear out all events of every type.
        var keys = Object.keys(self);
        for (i=0; i<keys.length; i++) {
          if ((keys[i].indexOf('_on') === 0) && Array.isArray(self[keys[i]])) {
            self[keys[i]] = [];
          }
        }
      }

      return self;
    },

    /**
     * Listen to a custom event and remove it once fired.
     * @param  {String}   event Event name.
     * @param  {Function} fn    Listener to call.
     * @param  {Number}   id    (optional) Only listen to events for this sound.
     * @return {Howl}
     */
    once: function(event, fn, id) {
      var self = this;

      // Setup the event listener.
      self.on(event, fn, id, 1);

      return self;
    },

    /**
     * Emit all events of a specific type and pass the sound id.
     * @param  {String} event Event name.
     * @param  {Number} id    Sound ID.
     * @param  {Number} msg   Message to go with event.
     * @return {Howl}
     */
    _emit: function(event, id, msg) {
      var self = this;
      var events = self['_on' + event];

      // Loop through event store and fire all functions.
      for (var i=events.length-1; i>=0; i--) {
        // Only fire the listener if the correct ID is used.
        if (!events[i].id || events[i].id === id || event === 'load') {
          setTimeout(function(fn) {
            fn.call(this, id, msg);
          }.bind(self, events[i].fn), 0);

          // If this event was setup with `once`, remove it.
          if (events[i].once) {
            self.off(event, events[i].fn, events[i].id);
          }
        }
      }

      // Pass the event type into load queue so that it can continue stepping.
      self._loadQueue(event);

      return self;
    },

    /**
     * Queue of actions initiated before the sound has loaded.
     * These will be called in sequence, with the next only firing
     * after the previous has finished executing (even if async like play).
     * @return {Howl}
     */
    _loadQueue: function(event) {
      var self = this;

      if (self._queue.length > 0) {
        var task = self._queue[0];

        // Remove this task if a matching event was passed.
        if (task.event === event) {
          self._queue.shift();
          self._loadQueue();
        }

        // Run the task if no event type is passed.
        if (!event) {
          task.action();
        }
      }

      return self;
    },

    /**
     * Fired when playback ends at the end of the duration.
     * @param  {Sound} sound The sound object to work with.
     * @return {Howl}
     */
    _ended: function(sound) {
      var self = this;
      var sprite = sound._sprite;

      // If we are using IE and there was network latency we may be clipping
      // audio before it completes playing. Lets check the node to make sure it
      // believes it has completed, before ending the playback.
      if (!self._webAudio && sound._node && !sound._node.paused && !sound._node.ended && sound._node.currentTime < sound._stop) {
        setTimeout(self._ended.bind(self, sound), 100);
        return self;
      }

      // Should this sound loop?
      var loop = !!(sound._loop || self._sprite[sprite][2]);

      // Fire the ended event.
      self._emit('end', sound._id);

      // Restart the playback for HTML5 Audio loop.
      if (!self._webAudio && loop) {
        self.stop(sound._id, true).play(sound._id);
      }

      // Restart this timer if on a Web Audio loop.
      if (self._webAudio && loop) {
        self._emit('play', sound._id);
        sound._seek = sound._start || 0;
        sound._rateSeek = 0;
        sound._playStart = Howler.ctx.currentTime;

        var timeout = ((sound._stop - sound._start) * 1000) / Math.abs(sound._rate);
        self._endTimers[sound._id] = setTimeout(self._ended.bind(self, sound), timeout);
      }

      // Mark the node as paused.
      if (self._webAudio && !loop) {
        sound._paused = true;
        sound._ended = true;
        sound._seek = sound._start || 0;
        sound._rateSeek = 0;
        self._clearTimer(sound._id);

        // Clean up the buffer source.
        self._cleanBuffer(sound._node);

        // Attempt to auto-suspend AudioContext if no sounds are still playing.
        Howler._autoSuspend();
      }

      // When using a sprite, end the track.
      if (!self._webAudio && !loop) {
        self.stop(sound._id, true);
      }

      return self;
    },

    /**
     * Clear the end timer for a sound playback.
     * @param  {Number} id The sound ID.
     * @return {Howl}
     */
    _clearTimer: function(id) {
      var self = this;

      if (self._endTimers[id]) {
        // Clear the timeout or remove the ended listener.
        if (typeof self._endTimers[id] !== 'function') {
          clearTimeout(self._endTimers[id]);
        } else {
          var sound = self._soundById(id);
          if (sound && sound._node) {
            sound._node.removeEventListener('ended', self._endTimers[id], false);
          }
        }

        delete self._endTimers[id];
      }

      return self;
    },

    /**
     * Return the sound identified by this ID, or return null.
     * @param  {Number} id Sound ID
     * @return {Object}    Sound object or null.
     */
    _soundById: function(id) {
      var self = this;

      // Loop through all sounds and find the one with this ID.
      for (var i=0; i<self._sounds.length; i++) {
        if (id === self._sounds[i]._id) {
          return self._sounds[i];
        }
      }

      return null;
    },

    /**
     * Return an inactive sound from the pool or create a new one.
     * @return {Sound} Sound playback object.
     */
    _inactiveSound: function() {
      var self = this;

      self._drain();

      // Find the first inactive node to recycle.
      for (var i=0; i<self._sounds.length; i++) {
        if (self._sounds[i]._ended) {
          return self._sounds[i].reset();
        }
      }

      // If no inactive node was found, create a new one.
      return new Sound(self);
    },

    /**
     * Drain excess inactive sounds from the pool.
     */
    _drain: function() {
      var self = this;
      var limit = self._pool;
      var cnt = 0;
      var i = 0;

      // If there are less sounds than the max pool size, we are done.
      if (self._sounds.length < limit) {
        return;
      }

      // Count the number of inactive sounds.
      for (i=0; i<self._sounds.length; i++) {
        if (self._sounds[i]._ended) {
          cnt++;
        }
      }

      // Remove excess inactive sounds, going in reverse order.
      for (i=self._sounds.length - 1; i>=0; i--) {
        if (cnt <= limit) {
          return;
        }

        if (self._sounds[i]._ended) {
          // Disconnect the audio source when using Web Audio.
          if (self._webAudio && self._sounds[i]._node) {
            self._sounds[i]._node.disconnect(0);
          }

          // Remove sounds until we have the pool size.
          self._sounds.splice(i, 1);
          cnt--;
        }
      }
    },

    /**
     * Get all ID's from the sounds pool.
     * @param  {Number} id Only return one ID if one is passed.
     * @return {Array}    Array of IDs.
     */
    _getSoundIds: function(id) {
      var self = this;

      if (typeof id === 'undefined') {
        var ids = [];
        for (var i=0; i<self._sounds.length; i++) {
          ids.push(self._sounds[i]._id);
        }

        return ids;
      } else {
        return [id];
      }
    },

    /**
     * Load the sound back into the buffer source.
     * @param  {Sound} sound The sound object to work with.
     * @return {Howl}
     */
    _refreshBuffer: function(sound) {
      var self = this;

      // Setup the buffer source for playback.
      sound._node.bufferSource = Howler.ctx.createBufferSource();
      sound._node.bufferSource.buffer = cache[self._src];

      // Connect to the correct node.
      if (sound._panner) {
        sound._node.bufferSource.connect(sound._panner);
      } else {
        sound._node.bufferSource.connect(sound._node);
      }

      // Setup looping and playback rate.
      sound._node.bufferSource.loop = sound._loop;
      if (sound._loop) {
        sound._node.bufferSource.loopStart = sound._start || 0;
        sound._node.bufferSource.loopEnd = sound._stop || 0;
      }
      sound._node.bufferSource.playbackRate.setValueAtTime(sound._rate, Howler.ctx.currentTime);

      return self;
    },

    /**
     * Prevent memory leaks by cleaning up the buffer source after playback.
     * @param  {Object} node Sound's audio node containing the buffer source.
     * @return {Howl}
     */
    _cleanBuffer: function(node) {
      var self = this;
      var isIOS = Howler._navigator && Howler._navigator.vendor.indexOf('Apple') >= 0;

      if (Howler._scratchBuffer && node.bufferSource) {
        node.bufferSource.onended = null;
        node.bufferSource.disconnect(0);
        if (isIOS) {
          try { node.bufferSource.buffer = Howler._scratchBuffer; } catch(e) {}
        }
      }
      node.bufferSource = null;

      return self;
    },

    /**
     * Set the source to a 0-second silence to stop any downloading (except in IE).
     * @param  {Object} node Audio node to clear.
     */
    _clearSound: function(node) {
      var checkIE = /MSIE |Trident\//.test(Howler._navigator && Howler._navigator.userAgent);
      if (!checkIE) {
        node.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      }
    }
  };

  /** Single Sound Methods **/
  /***************************************************************************/

  /**
   * Setup the sound object, which each node attached to a Howl group is contained in.
   * @param {Object} howl The Howl parent group.
   */
  var Sound = function(howl) {
    this._parent = howl;
    this.init();
  };
  Sound.prototype = {
    /**
     * Initialize a new Sound object.
     * @return {Sound}
     */
    init: function() {
      var self = this;
      var parent = self._parent;

      // Setup the default parameters.
      self._muted = parent._muted;
      self._loop = parent._loop;
      self._volume = parent._volume;
      self._rate = parent._rate;
      self._seek = 0;
      self._paused = true;
      self._ended = true;
      self._sprite = '__default';

      // Generate a unique ID for this sound.
      self._id = ++Howler._counter;

      // Add itself to the parent's pool.
      parent._sounds.push(self);

      // Create the new node.
      self.create();

      return self;
    },

    /**
     * Create and setup a new sound object, whether HTML5 Audio or Web Audio.
     * @return {Sound}
     */
    create: function() {
      var self = this;
      var parent = self._parent;
      var volume = (Howler._muted || self._muted || self._parent._muted) ? 0 : self._volume;

      if (parent._webAudio) {
        // Create the gain node for controlling volume (the source will connect to this).
        self._node = (typeof Howler.ctx.createGain === 'undefined') ? Howler.ctx.createGainNode() : Howler.ctx.createGain();
        self._node.gain.setValueAtTime(volume, Howler.ctx.currentTime);
        self._node.paused = true;
        self._node.connect(Howler.masterGain);
      } else if (!Howler.noAudio) {
        // Get an unlocked Audio object from the pool.
        self._node = Howler._obtainHtml5Audio();

        // Listen for errors (http://dev.w3.org/html5/spec-author-view/spec.html#mediaerror).
        self._errorFn = self._errorListener.bind(self);
        self._node.addEventListener('error', self._errorFn, false);

        // Listen for 'canplaythrough' event to let us know the sound is ready.
        self._loadFn = self._loadListener.bind(self);
        self._node.addEventListener(Howler._canPlayEvent, self._loadFn, false);

        // Listen for the 'ended' event on the sound to account for edge-case where
        // a finite sound has a duration of Infinity.
        self._endFn = self._endListener.bind(self);
        self._node.addEventListener('ended', self._endFn, false);

        // Setup the new audio node.
        self._node.src = parent._src;
        self._node.preload = parent._preload === true ? 'auto' : parent._preload;
        self._node.volume = volume * Howler.volume();

        // Begin loading the source.
        self._node.load();
      }

      return self;
    },

    /**
     * Reset the parameters of this sound to the original state (for recycle).
     * @return {Sound}
     */
    reset: function() {
      var self = this;
      var parent = self._parent;

      // Reset all of the parameters of this sound.
      self._muted = parent._muted;
      self._loop = parent._loop;
      self._volume = parent._volume;
      self._rate = parent._rate;
      self._seek = 0;
      self._rateSeek = 0;
      self._paused = true;
      self._ended = true;
      self._sprite = '__default';

      // Generate a new ID so that it isn't confused with the previous sound.
      self._id = ++Howler._counter;

      return self;
    },

    /**
     * HTML5 Audio error listener callback.
     */
    _errorListener: function() {
      var self = this;

      // Fire an error event and pass back the code.
      self._parent._emit('loaderror', self._id, self._node.error ? self._node.error.code : 0);

      // Clear the event listener.
      self._node.removeEventListener('error', self._errorFn, false);
    },

    /**
     * HTML5 Audio canplaythrough listener callback.
     */
    _loadListener: function() {
      var self = this;
      var parent = self._parent;

      // Round up the duration to account for the lower precision in HTML5 Audio.
      parent._duration = Math.ceil(self._node.duration * 10) / 10;

      // Setup a sprite if none is defined.
      if (Object.keys(parent._sprite).length === 0) {
        parent._sprite = {__default: [0, parent._duration * 1000]};
      }

      if (parent._state !== 'loaded') {
        parent._state = 'loaded';
        parent._emit('load');
        parent._loadQueue();
      }

      // Clear the event listener.
      self._node.removeEventListener(Howler._canPlayEvent, self._loadFn, false);
    },

    /**
     * HTML5 Audio ended listener callback.
     */
    _endListener: function() {
      var self = this;
      var parent = self._parent;

      // Only handle the `ended`` event if the duration is Infinity.
      if (parent._duration === Infinity) {
        // Update the parent duration to match the real audio duration.
        // Round up the duration to account for the lower precision in HTML5 Audio.
        parent._duration = Math.ceil(self._node.duration * 10) / 10;

        // Update the sprite that corresponds to the real duration.
        if (parent._sprite.__default[1] === Infinity) {
          parent._sprite.__default[1] = parent._duration * 1000;
        }

        // Run the regular ended method.
        parent._ended(self);
      }

      // Clear the event listener since the duration is now correct.
      self._node.removeEventListener('ended', self._endFn, false);
    }
  };

  /** Helper Methods **/
  /***************************************************************************/

  var cache = {};

  /**
   * Buffer a sound from URL, Data URI or cache and decode to audio source (Web Audio API).
   * @param  {Howl} self
   */
  var loadBuffer = function(self) {
    var url = self._src;

    // Check if the buffer has already been cached and use it instead.
    if (cache[url]) {
      // Set the duration from the cache.
      self._duration = cache[url].duration;

      // Load the sound into this Howl.
      loadSound(self);

      return;
    }

    if (/^data:[^;]+;base64,/.test(url)) {
      // Decode the base64 data URI without XHR, since some browsers don't support it.
      var data = atob(url.split(',')[1]);
      var dataView = new Uint8Array(data.length);
      for (var i=0; i<data.length; ++i) {
        dataView[i] = data.charCodeAt(i);
      }

      decodeAudioData(dataView.buffer, self);
    } else {
      // Load the buffer from the URL.
      var xhr = new XMLHttpRequest();
      xhr.open(self._xhr.method, url, true);
      xhr.withCredentials = self._xhr.withCredentials;
      xhr.responseType = 'arraybuffer';

      // Apply any custom headers to the request.
      if (self._xhr.headers) {
        Object.keys(self._xhr.headers).forEach(function(key) {
          xhr.setRequestHeader(key, self._xhr.headers[key]);
        });
      }

      xhr.onload = function() {
        // Make sure we get a successful response back.
        var code = (xhr.status + '')[0];
        if (code !== '0' && code !== '2' && code !== '3') {
          self._emit('loaderror', null, 'Failed loading audio file with status: ' + xhr.status + '.');
          return;
        }

        decodeAudioData(xhr.response, self);
      };
      xhr.onerror = function() {
        // If there is an error, switch to HTML5 Audio.
        if (self._webAudio) {
          self._html5 = true;
          self._webAudio = false;
          self._sounds = [];
          delete cache[url];
          self.load();
        }
      };
      safeXhrSend(xhr);
    }
  };

  /**
   * Send the XHR request wrapped in a try/catch.
   * @param  {Object} xhr XHR to send.
   */
  var safeXhrSend = function(xhr) {
    try {
      xhr.send();
    } catch (e) {
      xhr.onerror();
    }
  };

  /**
   * Decode audio data from an array buffer.
   * @param  {ArrayBuffer} arraybuffer The audio data.
   * @param  {Howl}        self
   */
  var decodeAudioData = function(arraybuffer, self) {
    // Fire a load error if something broke.
    var error = function() {
      self._emit('loaderror', null, 'Decoding audio data failed.');
    };

    // Load the sound on success.
    var success = function(buffer) {
      if (buffer && self._sounds.length > 0) {
        cache[self._src] = buffer;
        loadSound(self, buffer);
      } else {
        error();
      }
    };

    // Decode the buffer into an audio source.
    if (typeof Promise !== 'undefined' && Howler.ctx.decodeAudioData.length === 1) {
      Howler.ctx.decodeAudioData(arraybuffer).then(success).catch(error);
    } else {
      Howler.ctx.decodeAudioData(arraybuffer, success, error);
    }
  }

  /**
   * Sound is now loaded, so finish setting everything up and fire the loaded event.
   * @param  {Howl} self
   * @param  {Object} buffer The decoded buffer sound source.
   */
  var loadSound = function(self, buffer) {
    // Set the duration.
    if (buffer && !self._duration) {
      self._duration = buffer.duration;
    }

    // Setup a sprite if none is defined.
    if (Object.keys(self._sprite).length === 0) {
      self._sprite = {__default: [0, self._duration * 1000]};
    }

    // Fire the loaded event.
    if (self._state !== 'loaded') {
      self._state = 'loaded';
      self._emit('load');
      self._loadQueue();
    }
  };

  /**
   * Setup the audio context when available, or switch to HTML5 Audio mode.
   */
  var setupAudioContext = function() {
    // If we have already detected that Web Audio isn't supported, don't run this step again.
    if (!Howler.usingWebAudio) {
      return;
    }

    // Check if we are using Web Audio and setup the AudioContext if we are.
    try {
      if (typeof AudioContext !== 'undefined') {
        Howler.ctx = new AudioContext();
      } else if (typeof webkitAudioContext !== 'undefined') {
        Howler.ctx = new webkitAudioContext();
      } else {
        Howler.usingWebAudio = false;
      }
    } catch(e) {
      Howler.usingWebAudio = false;
    }

    // If the audio context creation still failed, set using web audio to false.
    if (!Howler.ctx) {
      Howler.usingWebAudio = false;
    }

    // Check if a webview is being used on iOS8 or earlier (rather than the browser).
    // If it is, disable Web Audio as it causes crashing.
    var iOS = (/iP(hone|od|ad)/.test(Howler._navigator && Howler._navigator.platform));
    var appVersion = Howler._navigator && Howler._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
    var version = appVersion ? parseInt(appVersion[1], 10) : null;
    if (iOS && version && version < 9) {
      var safari = /safari/.test(Howler._navigator && Howler._navigator.userAgent.toLowerCase());
      if (Howler._navigator && !safari) {
        Howler.usingWebAudio = false;
      }
    }

    // Create and expose the master GainNode when using Web Audio (useful for plugins or advanced usage).
    if (Howler.usingWebAudio) {
      Howler.masterGain = (typeof Howler.ctx.createGain === 'undefined') ? Howler.ctx.createGainNode() : Howler.ctx.createGain();
      Howler.masterGain.gain.setValueAtTime(Howler._muted ? 0 : Howler._volume, Howler.ctx.currentTime);
      Howler.masterGain.connect(Howler.ctx.destination);
    }

    // Re-run the setup on Howler.
    Howler._setup();
  };

  // Add support for AMD (Asynchronous Module Definition) libraries such as require.js.
  if (typeof define === 'function' && define.amd) {
    define([], function() {
      return {
        Howler: Howler,
        Howl: Howl
      };
    });
  }

  // Add support for CommonJS libraries such as browserify.
  if (typeof exports !== 'undefined') {
    exports.Howler = Howler;
    exports.Howl = Howl;
  }

  // Add to global in Node.js (for testing, etc).
  if (typeof global !== 'undefined') {
    global.HowlerGlobal = HowlerGlobal;
    global.Howler = Howler;
    global.Howl = Howl;
    global.Sound = Sound;
  } else if (typeof window !== 'undefined') {  // Define globally in case AMD is not available or unused.
    window.HowlerGlobal = HowlerGlobal;
    window.Howler = Howler;
    window.Howl = Howl;
    window.Sound = Sound;
  }
})();


/*!
 *  Spatial Plugin - Adds support for stereo and 3D audio where Web Audio is supported.
 *  
 *  howler.js v2.2.1
 *  howlerjs.com
 *
 *  (c) 2013-2020, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */

(function() {

  'use strict';

  // Setup default properties.
  HowlerGlobal.prototype._pos = [0, 0, 0];
  HowlerGlobal.prototype._orientation = [0, 0, -1, 0, 1, 0];

  /** Global Methods **/
  /***************************************************************************/

  /**
   * Helper method to update the stereo panning position of all current Howls.
   * Future Howls will not use this value unless explicitly set.
   * @param  {Number} pan A value of -1.0 is all the way left and 1.0 is all the way right.
   * @return {Howler/Number}     Self or current stereo panning value.
   */
  HowlerGlobal.prototype.stereo = function(pan) {
    var self = this;

    // Stop right here if not using Web Audio.
    if (!self.ctx || !self.ctx.listener) {
      return self;
    }

    // Loop through all Howls and update their stereo panning.
    for (var i=self._howls.length-1; i>=0; i--) {
      self._howls[i].stereo(pan);
    }

    return self;
  };

  /**
   * Get/set the position of the listener in 3D cartesian space. Sounds using
   * 3D position will be relative to the listener's position.
   * @param  {Number} x The x-position of the listener.
   * @param  {Number} y The y-position of the listener.
   * @param  {Number} z The z-position of the listener.
   * @return {Howler/Array}   Self or current listener position.
   */
  HowlerGlobal.prototype.pos = function(x, y, z) {
    var self = this;

    // Stop right here if not using Web Audio.
    if (!self.ctx || !self.ctx.listener) {
      return self;
    }

    // Set the defaults for optional 'y' & 'z'.
    y = (typeof y !== 'number') ? self._pos[1] : y;
    z = (typeof z !== 'number') ? self._pos[2] : z;

    if (typeof x === 'number') {
      self._pos = [x, y, z];

      if (typeof self.ctx.listener.positionX !== 'undefined') {
        self.ctx.listener.positionX.setTargetAtTime(self._pos[0], Howler.ctx.currentTime, 0.1);
        self.ctx.listener.positionY.setTargetAtTime(self._pos[1], Howler.ctx.currentTime, 0.1);
        self.ctx.listener.positionZ.setTargetAtTime(self._pos[2], Howler.ctx.currentTime, 0.1);
      } else {
        self.ctx.listener.setPosition(self._pos[0], self._pos[1], self._pos[2]);
      }
    } else {
      return self._pos;
    }

    return self;
  };

  /**
   * Get/set the direction the listener is pointing in the 3D cartesian space.
   * A front and up vector must be provided. The front is the direction the
   * face of the listener is pointing, and up is the direction the top of the
   * listener is pointing. Thus, these values are expected to be at right angles
   * from each other.
   * @param  {Number} x   The x-orientation of the listener.
   * @param  {Number} y   The y-orientation of the listener.
   * @param  {Number} z   The z-orientation of the listener.
   * @param  {Number} xUp The x-orientation of the top of the listener.
   * @param  {Number} yUp The y-orientation of the top of the listener.
   * @param  {Number} zUp The z-orientation of the top of the listener.
   * @return {Howler/Array}     Returns self or the current orientation vectors.
   */
  HowlerGlobal.prototype.orientation = function(x, y, z, xUp, yUp, zUp) {
    var self = this;

    // Stop right here if not using Web Audio.
    if (!self.ctx || !self.ctx.listener) {
      return self;
    }

    // Set the defaults for optional 'y' & 'z'.
    var or = self._orientation;
    y = (typeof y !== 'number') ? or[1] : y;
    z = (typeof z !== 'number') ? or[2] : z;
    xUp = (typeof xUp !== 'number') ? or[3] : xUp;
    yUp = (typeof yUp !== 'number') ? or[4] : yUp;
    zUp = (typeof zUp !== 'number') ? or[5] : zUp;

    if (typeof x === 'number') {
      self._orientation = [x, y, z, xUp, yUp, zUp];

      if (typeof self.ctx.listener.forwardX !== 'undefined') {
        self.ctx.listener.forwardX.setTargetAtTime(x, Howler.ctx.currentTime, 0.1);
        self.ctx.listener.forwardY.setTargetAtTime(y, Howler.ctx.currentTime, 0.1);
        self.ctx.listener.forwardZ.setTargetAtTime(z, Howler.ctx.currentTime, 0.1);
        self.ctx.listener.upX.setTargetAtTime(xUp, Howler.ctx.currentTime, 0.1);
        self.ctx.listener.upY.setTargetAtTime(yUp, Howler.ctx.currentTime, 0.1);
        self.ctx.listener.upZ.setTargetAtTime(zUp, Howler.ctx.currentTime, 0.1);
      } else {
        self.ctx.listener.setOrientation(x, y, z, xUp, yUp, zUp);
      }
    } else {
      return or;
    }

    return self;
  };

  /** Group Methods **/
  /***************************************************************************/

  /**
   * Add new properties to the core init.
   * @param  {Function} _super Core init method.
   * @return {Howl}
   */
  Howl.prototype.init = (function(_super) {
    return function(o) {
      var self = this;

      // Setup user-defined default properties.
      self._orientation = o.orientation || [1, 0, 0];
      self._stereo = o.stereo || null;
      self._pos = o.pos || null;
      self._pannerAttr = {
        coneInnerAngle: typeof o.coneInnerAngle !== 'undefined' ? o.coneInnerAngle : 360,
        coneOuterAngle: typeof o.coneOuterAngle !== 'undefined' ? o.coneOuterAngle : 360,
        coneOuterGain: typeof o.coneOuterGain !== 'undefined' ? o.coneOuterGain : 0,
        distanceModel: typeof o.distanceModel !== 'undefined' ? o.distanceModel : 'inverse',
        maxDistance: typeof o.maxDistance !== 'undefined' ? o.maxDistance : 10000,
        panningModel: typeof o.panningModel !== 'undefined' ? o.panningModel : 'HRTF',
        refDistance: typeof o.refDistance !== 'undefined' ? o.refDistance : 1,
        rolloffFactor: typeof o.rolloffFactor !== 'undefined' ? o.rolloffFactor : 1
      };

      // Setup event listeners.
      self._onstereo = o.onstereo ? [{fn: o.onstereo}] : [];
      self._onpos = o.onpos ? [{fn: o.onpos}] : [];
      self._onorientation = o.onorientation ? [{fn: o.onorientation}] : [];

      // Complete initilization with howler.js core's init function.
      return _super.call(this, o);
    };
  })(Howl.prototype.init);

  /**
   * Get/set the stereo panning of the audio source for this sound or all in the group.
   * @param  {Number} pan  A value of -1.0 is all the way left and 1.0 is all the way right.
   * @param  {Number} id (optional) The sound ID. If none is passed, all in group will be updated.
   * @return {Howl/Number}    Returns self or the current stereo panning value.
   */
  Howl.prototype.stereo = function(pan, id) {
    var self = this;

    // Stop right here if not using Web Audio.
    if (!self._webAudio) {
      return self;
    }

    // If the sound hasn't loaded, add it to the load queue to change stereo pan when capable.
    if (self._state !== 'loaded') {
      self._queue.push({
        event: 'stereo',
        action: function() {
          self.stereo(pan, id);
        }
      });

      return self;
    }

    // Check for PannerStereoNode support and fallback to PannerNode if it doesn't exist.
    var pannerType = (typeof Howler.ctx.createStereoPanner === 'undefined') ? 'spatial' : 'stereo';

    // Setup the group's stereo panning if no ID is passed.
    if (typeof id === 'undefined') {
      // Return the group's stereo panning if no parameters are passed.
      if (typeof pan === 'number') {
        self._stereo = pan;
        self._pos = [pan, 0, 0];
      } else {
        return self._stereo;
      }
    }

    // Change the streo panning of one or all sounds in group.
    var ids = self._getSoundIds(id);
    for (var i=0; i<ids.length; i++) {
      // Get the sound.
      var sound = self._soundById(ids[i]);

      if (sound) {
        if (typeof pan === 'number') {
          sound._stereo = pan;
          sound._pos = [pan, 0, 0];

          if (sound._node) {
            // If we are falling back, make sure the panningModel is equalpower.
            sound._pannerAttr.panningModel = 'equalpower';

            // Check if there is a panner setup and create a new one if not.
            if (!sound._panner || !sound._panner.pan) {
              setupPanner(sound, pannerType);
            }

            if (pannerType === 'spatial') {
              if (typeof sound._panner.positionX !== 'undefined') {
                sound._panner.positionX.setValueAtTime(pan, Howler.ctx.currentTime);
                sound._panner.positionY.setValueAtTime(0, Howler.ctx.currentTime);
                sound._panner.positionZ.setValueAtTime(0, Howler.ctx.currentTime);
              } else {
                sound._panner.setPosition(pan, 0, 0);
              }
            } else {
              sound._panner.pan.setValueAtTime(pan, Howler.ctx.currentTime);
            }
          }

          self._emit('stereo', sound._id);
        } else {
          return sound._stereo;
        }
      }
    }

    return self;
  };

  /**
   * Get/set the 3D spatial position of the audio source for this sound or group relative to the global listener.
   * @param  {Number} x  The x-position of the audio source.
   * @param  {Number} y  The y-position of the audio source.
   * @param  {Number} z  The z-position of the audio source.
   * @param  {Number} id (optional) The sound ID. If none is passed, all in group will be updated.
   * @return {Howl/Array}    Returns self or the current 3D spatial position: [x, y, z].
   */
  Howl.prototype.pos = function(x, y, z, id) {
    var self = this;

    // Stop right here if not using Web Audio.
    if (!self._webAudio) {
      return self;
    }

    // If the sound hasn't loaded, add it to the load queue to change position when capable.
    if (self._state !== 'loaded') {
      self._queue.push({
        event: 'pos',
        action: function() {
          self.pos(x, y, z, id);
        }
      });

      return self;
    }

    // Set the defaults for optional 'y' & 'z'.
    y = (typeof y !== 'number') ? 0 : y;
    z = (typeof z !== 'number') ? -0.5 : z;

    // Setup the group's spatial position if no ID is passed.
    if (typeof id === 'undefined') {
      // Return the group's spatial position if no parameters are passed.
      if (typeof x === 'number') {
        self._pos = [x, y, z];
      } else {
        return self._pos;
      }
    }

    // Change the spatial position of one or all sounds in group.
    var ids = self._getSoundIds(id);
    for (var i=0; i<ids.length; i++) {
      // Get the sound.
      var sound = self._soundById(ids[i]);

      if (sound) {
        if (typeof x === 'number') {
          sound._pos = [x, y, z];

          if (sound._node) {
            // Check if there is a panner setup and create a new one if not.
            if (!sound._panner || sound._panner.pan) {
              setupPanner(sound, 'spatial');
            }

            if (typeof sound._panner.positionX !== 'undefined') {
              sound._panner.positionX.setValueAtTime(x, Howler.ctx.currentTime);
              sound._panner.positionY.setValueAtTime(y, Howler.ctx.currentTime);
              sound._panner.positionZ.setValueAtTime(z, Howler.ctx.currentTime);
            } else {
              sound._panner.setPosition(x, y, z);
            }
          }

          self._emit('pos', sound._id);
        } else {
          return sound._pos;
        }
      }
    }

    return self;
  };

  /**
   * Get/set the direction the audio source is pointing in the 3D cartesian coordinate
   * space. Depending on how direction the sound is, based on the `cone` attributes,
   * a sound pointing away from the listener can be quiet or silent.
   * @param  {Number} x  The x-orientation of the source.
   * @param  {Number} y  The y-orientation of the source.
   * @param  {Number} z  The z-orientation of the source.
   * @param  {Number} id (optional) The sound ID. If none is passed, all in group will be updated.
   * @return {Howl/Array}    Returns self or the current 3D spatial orientation: [x, y, z].
   */
  Howl.prototype.orientation = function(x, y, z, id) {
    var self = this;

    // Stop right here if not using Web Audio.
    if (!self._webAudio) {
      return self;
    }

    // If the sound hasn't loaded, add it to the load queue to change orientation when capable.
    if (self._state !== 'loaded') {
      self._queue.push({
        event: 'orientation',
        action: function() {
          self.orientation(x, y, z, id);
        }
      });

      return self;
    }

    // Set the defaults for optional 'y' & 'z'.
    y = (typeof y !== 'number') ? self._orientation[1] : y;
    z = (typeof z !== 'number') ? self._orientation[2] : z;

    // Setup the group's spatial orientation if no ID is passed.
    if (typeof id === 'undefined') {
      // Return the group's spatial orientation if no parameters are passed.
      if (typeof x === 'number') {
        self._orientation = [x, y, z];
      } else {
        return self._orientation;
      }
    }

    // Change the spatial orientation of one or all sounds in group.
    var ids = self._getSoundIds(id);
    for (var i=0; i<ids.length; i++) {
      // Get the sound.
      var sound = self._soundById(ids[i]);

      if (sound) {
        if (typeof x === 'number') {
          sound._orientation = [x, y, z];

          if (sound._node) {
            // Check if there is a panner setup and create a new one if not.
            if (!sound._panner) {
              // Make sure we have a position to setup the node with.
              if (!sound._pos) {
                sound._pos = self._pos || [0, 0, -0.5];
              }

              setupPanner(sound, 'spatial');
            }

            if (typeof sound._panner.orientationX !== 'undefined') {
              sound._panner.orientationX.setValueAtTime(x, Howler.ctx.currentTime);
              sound._panner.orientationY.setValueAtTime(y, Howler.ctx.currentTime);
              sound._panner.orientationZ.setValueAtTime(z, Howler.ctx.currentTime);
            } else {
              sound._panner.setOrientation(x, y, z);
            }
          }

          self._emit('orientation', sound._id);
        } else {
          return sound._orientation;
        }
      }
    }

    return self;
  };

  /**
   * Get/set the panner node's attributes for a sound or group of sounds.
   * This method can optionall take 0, 1 or 2 arguments.
   *   pannerAttr() -> Returns the group's values.
   *   pannerAttr(id) -> Returns the sound id's values.
   *   pannerAttr(o) -> Set's the values of all sounds in this Howl group.
   *   pannerAttr(o, id) -> Set's the values of passed sound id.
   *
   *   Attributes:
   *     coneInnerAngle - (360 by default) A parameter for directional audio sources, this is an angle, in degrees,
   *                      inside of which there will be no volume reduction.
   *     coneOuterAngle - (360 by default) A parameter for directional audio sources, this is an angle, in degrees,
   *                      outside of which the volume will be reduced to a constant value of `coneOuterGain`.
   *     coneOuterGain - (0 by default) A parameter for directional audio sources, this is the gain outside of the
   *                     `coneOuterAngle`. It is a linear value in the range `[0, 1]`.
   *     distanceModel - ('inverse' by default) Determines algorithm used to reduce volume as audio moves away from
   *                     listener. Can be `linear`, `inverse` or `exponential.
   *     maxDistance - (10000 by default) The maximum distance between source and listener, after which the volume
   *                   will not be reduced any further.
   *     refDistance - (1 by default) A reference distance for reducing volume as source moves further from the listener.
   *                   This is simply a variable of the distance model and has a different effect depending on which model
   *                   is used and the scale of your coordinates. Generally, volume will be equal to 1 at this distance.
   *     rolloffFactor - (1 by default) How quickly the volume reduces as source moves from listener. This is simply a
   *                     variable of the distance model and can be in the range of `[0, 1]` with `linear` and `[0, ∞]`
   *                     with `inverse` and `exponential`.
   *     panningModel - ('HRTF' by default) Determines which spatialization algorithm is used to position audio.
   *                     Can be `HRTF` or `equalpower`.
   *
   * @return {Howl/Object} Returns self or current panner attributes.
   */
  Howl.prototype.pannerAttr = function() {
    var self = this;
    var args = arguments;
    var o, id, sound;

    // Stop right here if not using Web Audio.
    if (!self._webAudio) {
      return self;
    }

    // Determine the values based on arguments.
    if (args.length === 0) {
      // Return the group's panner attribute values.
      return self._pannerAttr;
    } else if (args.length === 1) {
      if (typeof args[0] === 'object') {
        o = args[0];

        // Set the grou's panner attribute values.
        if (typeof id === 'undefined') {
          if (!o.pannerAttr) {
            o.pannerAttr = {
              coneInnerAngle: o.coneInnerAngle,
              coneOuterAngle: o.coneOuterAngle,
              coneOuterGain: o.coneOuterGain,
              distanceModel: o.distanceModel,
              maxDistance: o.maxDistance,
              refDistance: o.refDistance,
              rolloffFactor: o.rolloffFactor,
              panningModel: o.panningModel
            };
          }

          self._pannerAttr = {
            coneInnerAngle: typeof o.pannerAttr.coneInnerAngle !== 'undefined' ? o.pannerAttr.coneInnerAngle : self._coneInnerAngle,
            coneOuterAngle: typeof o.pannerAttr.coneOuterAngle !== 'undefined' ? o.pannerAttr.coneOuterAngle : self._coneOuterAngle,
            coneOuterGain: typeof o.pannerAttr.coneOuterGain !== 'undefined' ? o.pannerAttr.coneOuterGain : self._coneOuterGain,
            distanceModel: typeof o.pannerAttr.distanceModel !== 'undefined' ? o.pannerAttr.distanceModel : self._distanceModel,
            maxDistance: typeof o.pannerAttr.maxDistance !== 'undefined' ? o.pannerAttr.maxDistance : self._maxDistance,
            refDistance: typeof o.pannerAttr.refDistance !== 'undefined' ? o.pannerAttr.refDistance : self._refDistance,
            rolloffFactor: typeof o.pannerAttr.rolloffFactor !== 'undefined' ? o.pannerAttr.rolloffFactor : self._rolloffFactor,
            panningModel: typeof o.pannerAttr.panningModel !== 'undefined' ? o.pannerAttr.panningModel : self._panningModel
          };
        }
      } else {
        // Return this sound's panner attribute values.
        sound = self._soundById(parseInt(args[0], 10));
        return sound ? sound._pannerAttr : self._pannerAttr;
      }
    } else if (args.length === 2) {
      o = args[0];
      id = parseInt(args[1], 10);
    }

    // Update the values of the specified sounds.
    var ids = self._getSoundIds(id);
    for (var i=0; i<ids.length; i++) {
      sound = self._soundById(ids[i]);

      if (sound) {
        // Merge the new values into the sound.
        var pa = sound._pannerAttr;
        pa = {
          coneInnerAngle: typeof o.coneInnerAngle !== 'undefined' ? o.coneInnerAngle : pa.coneInnerAngle,
          coneOuterAngle: typeof o.coneOuterAngle !== 'undefined' ? o.coneOuterAngle : pa.coneOuterAngle,
          coneOuterGain: typeof o.coneOuterGain !== 'undefined' ? o.coneOuterGain : pa.coneOuterGain,
          distanceModel: typeof o.distanceModel !== 'undefined' ? o.distanceModel : pa.distanceModel,
          maxDistance: typeof o.maxDistance !== 'undefined' ? o.maxDistance : pa.maxDistance,
          refDistance: typeof o.refDistance !== 'undefined' ? o.refDistance : pa.refDistance,
          rolloffFactor: typeof o.rolloffFactor !== 'undefined' ? o.rolloffFactor : pa.rolloffFactor,
          panningModel: typeof o.panningModel !== 'undefined' ? o.panningModel : pa.panningModel
        };

        // Update the panner values or create a new panner if none exists.
        var panner = sound._panner;
        if (panner) {
          panner.coneInnerAngle = pa.coneInnerAngle;
          panner.coneOuterAngle = pa.coneOuterAngle;
          panner.coneOuterGain = pa.coneOuterGain;
          panner.distanceModel = pa.distanceModel;
          panner.maxDistance = pa.maxDistance;
          panner.refDistance = pa.refDistance;
          panner.rolloffFactor = pa.rolloffFactor;
          panner.panningModel = pa.panningModel;
        } else {
          // Make sure we have a position to setup the node with.
          if (!sound._pos) {
            sound._pos = self._pos || [0, 0, -0.5];
          }

          // Create a new panner node.
          setupPanner(sound, 'spatial');
        }
      }
    }

    return self;
  };

  /** Single Sound Methods **/
  /***************************************************************************/

  /**
   * Add new properties to the core Sound init.
   * @param  {Function} _super Core Sound init method.
   * @return {Sound}
   */
  Sound.prototype.init = (function(_super) {
    return function() {
      var self = this;
      var parent = self._parent;

      // Setup user-defined default properties.
      self._orientation = parent._orientation;
      self._stereo = parent._stereo;
      self._pos = parent._pos;
      self._pannerAttr = parent._pannerAttr;

      // Complete initilization with howler.js core Sound's init function.
      _super.call(this);

      // If a stereo or position was specified, set it up.
      if (self._stereo) {
        parent.stereo(self._stereo);
      } else if (self._pos) {
        parent.pos(self._pos[0], self._pos[1], self._pos[2], self._id);
      }
    };
  })(Sound.prototype.init);

  /**
   * Override the Sound.reset method to clean up properties from the spatial plugin.
   * @param  {Function} _super Sound reset method.
   * @return {Sound}
   */
  Sound.prototype.reset = (function(_super) {
    return function() {
      var self = this;
      var parent = self._parent;

      // Reset all spatial plugin properties on this sound.
      self._orientation = parent._orientation;
      self._stereo = parent._stereo;
      self._pos = parent._pos;
      self._pannerAttr = parent._pannerAttr;

      // If a stereo or position was specified, set it up.
      if (self._stereo) {
        parent.stereo(self._stereo);
      } else if (self._pos) {
        parent.pos(self._pos[0], self._pos[1], self._pos[2], self._id);
      } else if (self._panner) {
        // Disconnect the panner.
        self._panner.disconnect(0);
        self._panner = undefined;
        parent._refreshBuffer(self);
      }

      // Complete resetting of the sound.
      return _super.call(this);
    };
  })(Sound.prototype.reset);

  /** Helper Methods **/
  /***************************************************************************/

  /**
   * Create a new panner node and save it on the sound.
   * @param  {Sound} sound Specific sound to setup panning on.
   * @param {String} type Type of panner to create: 'stereo' or 'spatial'.
   */
  var setupPanner = function(sound, type) {
    type = type || 'spatial';

    // Create the new panner node.
    if (type === 'spatial') {
      sound._panner = Howler.ctx.createPanner();
      sound._panner.coneInnerAngle = sound._pannerAttr.coneInnerAngle;
      sound._panner.coneOuterAngle = sound._pannerAttr.coneOuterAngle;
      sound._panner.coneOuterGain = sound._pannerAttr.coneOuterGain;
      sound._panner.distanceModel = sound._pannerAttr.distanceModel;
      sound._panner.maxDistance = sound._pannerAttr.maxDistance;
      sound._panner.refDistance = sound._pannerAttr.refDistance;
      sound._panner.rolloffFactor = sound._pannerAttr.rolloffFactor;
      sound._panner.panningModel = sound._pannerAttr.panningModel;

      if (typeof sound._panner.positionX !== 'undefined') {
        sound._panner.positionX.setValueAtTime(sound._pos[0], Howler.ctx.currentTime);
        sound._panner.positionY.setValueAtTime(sound._pos[1], Howler.ctx.currentTime);
        sound._panner.positionZ.setValueAtTime(sound._pos[2], Howler.ctx.currentTime);
      } else {
        sound._panner.setPosition(sound._pos[0], sound._pos[1], sound._pos[2]);
      }

      if (typeof sound._panner.orientationX !== 'undefined') {
        sound._panner.orientationX.setValueAtTime(sound._orientation[0], Howler.ctx.currentTime);
        sound._panner.orientationY.setValueAtTime(sound._orientation[1], Howler.ctx.currentTime);
        sound._panner.orientationZ.setValueAtTime(sound._orientation[2], Howler.ctx.currentTime);
      } else {
        sound._panner.setOrientation(sound._orientation[0], sound._orientation[1], sound._orientation[2]);
      }
    } else {
      sound._panner = Howler.ctx.createStereoPanner();
      sound._panner.pan.setValueAtTime(sound._stereo, Howler.ctx.currentTime);
    }

    sound._panner.connect(sound._node);

    // Update the connections.
    if (!sound._paused) {
      sound._parent.pause(sound._id, true).play(sound._id, true);
    }
  };
})();

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){

const Vec2 = require("./vec2")

// Sprite
class Animation {
    constructor(frames, pos, box, t, interface_bind, repeating) {
        this.frames = frames; // Images
        this.pos = new Vec2(pos.x, pos.y); // Position
        this.box = box; // Size
        this.frameTime = t; // Frame change period
        this.timer = this.frameTime; // Countdown to change frame
        this.currentFrame = 0; // id of current frame
        this.alive = 1; // If 0 - animation must be deleted

        if (interface_bind) {
            this.interface_bind = 1; // drawn at very top of all layers
        } else {
            this.interface_bind = 0;
        }
        if (repeating) { // 0 - dying after repeating, 1 - repeating, 2 - last frame alive
            this.repeating = repeating;
        } else {
            this.repeating = 0;
        }
    }

    step() {
        this.timer -= DT;
        if (this.timer <= 0) {
            this.currentFrame++;
            this.timer = this.frameTime;
            if (this.currentFrame >= this.frames.length)
            {
                if (this.repeating === 0) { // Repeating check
                    this.alive = 0;
                }
                else if (this.repeating === 1) {
                    this.currentFrame = 0;
                }
            }
        }
    }

    getFrame() {
        return this.frames[this.currentFrame];
    }
}

module.exports = Animation
},{"./vec2":15}],3:[function(require,module,exports){
class Anime {
    constructor(frame_time, frames) {
        this.frame_time = frame_time;
        this.frames = frames;
        this.frame = 0;
        this.frames_cnt = this.frames.length;
    }
}

module.exports = Anime
},{}],4:[function(require,module,exports){
// Cell on the grid
class Cell {
    constructor() {
        this.ground = 0;
        this.covering = 0;
        this.grave = 0;
        this.gates = 0; // 0 - none, 1 - left part, 2 - right part
        this.obstacle = 0; // 0 - player can pass, 1 - player can't pass
        this.type = 0; // For different texturing
        this.light = 0; // Illumination

        this.zombieNav = 0; // Used to navigate zombies
        this.ghostNav = 0; // Used to navigate zombies
    }
}

module.exports = Cell
},{}],5:[function(require,module,exports){
class Deque {
    constructor() {
        this.front = this.back = undefined;
    }
    addFront(value) {
        if (!this.front) this.front = this.back = { value };
        else this.front = this.front.next = { value, prev: this.front };
    }
    removeFront() {
        let value = this.peekFront();
        if (this.front === this.back) this.front = this.back = undefined;
        else (this.front = this.front.prev).next = undefined;
        return value;
    }
    peekFront() { 
        return this.front && this.front.value;
    }
    addBack(value) {
        if (!this.front) this.front = this.back = { value };
        else this.back = this.back.prev = { value, next: this.back };
    }
    removeBack() {
        let value = this.peekBack();
        if (this.front === this.back) this.front = this.back = undefined;
        else (this.back = this.back.next).back = undefined;
        return value;
    }
    peekBack() { 
        return this.back && this.back.value;
    }
}

module.exports = Deque
},{}],6:[function(require,module,exports){

const Vec2 = require("./vec2")

// This class is responsible for drawing
class Draw {
    constructor(ctx) {
        this.ctx = ctx;

        this.cam = new Vec2(0, 0); // Camera position
        this.center = new Vec2(64, 64); // Screen center (здфнукы ы)
    }

    image(texture, x, y, w, h, flip) {
        // x = Math.round(x);
        // y = Math.round(y);
        // w = Math.round(w);
        // h = Math.round(h);

        if(!flip)
            flip = 0;

        this.ctx.save();
        let width = 1;
        if (flip) {
            this.ctx.scale(-1, 1);
            width = -1;
        }
        this.ctx.imageSmoothingEnabled = 0;
        this.ctx.drawImage(texture, width*(x + w * flip - this.cam.x + this.center.x) * SCALE, (y - this.cam.y + this.center.y) * SCALE, w * SCALE, h * SCALE);
        this.ctx.restore();
    }

    rect(x, y, w, h, color) {
        // x = Math.round(x);
        // y = Math.round(y);
        // w = Math.round(w);
        // h = Math.round(h);

        this.ctx.imageSmoothingEnabled = 0;
        this.ctx.fillStyle = color;
        this.ctx.fillRect((x - this.cam.x + this.center.x) * SCALE, (y - this.cam.y + this.center.y) * SCALE, w * SCALE, h * SCALE);
    }

    draw(game) {

        // Focusing camera
        this.cam = game.player.pos;
        this.center = new Vec2(64, 64);

        // Filling background
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, 10000, 10000);

        this.ySorted = [];

        // Grid
        for (let x = 0; x < SIZE_X; x++) {
            for (let y = 0; y < SIZE_Y; y++) {
                if(game.grid[x][y].light <= 0 && game.player.pos.dist(new Vec2(x * 8 + 4, y * 8 + 4)) > DIST_LIGHT * 2) // We don't see this cell
                   continue;
                let cell = game.grid[x][y];


                if (cell.ground) {
                    this.ySorted.push([IMGS_GROUND[cell.ground - 1], x * CELL_SIZE, y * CELL_SIZE, TEXTURE_SIZE, TEXTURE_SIZE, 0, -5]);
                }
                if (cell.covering) {
                    this.ySorted.push([IMGS_COVERING[cell.covering - 1], x * CELL_SIZE, (y - 1) * CELL_SIZE, TEXTURE_SIZE, TEXTURE_SIZE * 2, 0, -4]);
                }

                if (cell.gates) {
                    if (game.gates_state === 1)
                        this.ySorted.push([IMGS_GATES[+cell.gates - 1], x * CELL_SIZE, (y - 1) * CELL_SIZE, TEXTURE_SIZE, TEXTURE_SIZE * 2, 0, (y + 1) * 8]);
                    continue;
                }

                if (cell.grave) {
                    if (cell.grave > 0) {
                        this.ySorted.push([IMGS_GRAVE[+cell.grave - 1], x * CELL_SIZE, (y - 1) * CELL_SIZE, TEXTURE_SIZE, TEXTURE_SIZE * 2, 0, (y + 1) * 8]);
                    } else { // Spec grave
                        this.ySorted.push([IMGS_SPEC_GRAVE[-cell.grave - 1], x * CELL_SIZE, (y - 1) * CELL_SIZE, TEXTURE_SIZE, TEXTURE_SIZE * 2, 0, (y + 1) * 8]);
                    }
                }
            }
        }

        // Player
        let cur_texture = game.player.get_frame();
        this.ySorted.push([cur_texture, game.player.pos.x - CELL_SIZE / 2, game.player.pos.y - 2 * CELL_SIZE, TEXTURE_SIZE, TEXTURE_SIZE * 2, game.player.right === 0, game.player.pos.y]);

        // Monsters
        for (let i = 0; i < game.monsters.length; i++) {
            let monster = game.monsters[i];
            let frame = monster.get_frame();
            this.ySorted.push([frame, monster.pos.x - CELL_SIZE / 2, monster.pos.y - CELL_SIZE * 2, TEXTURE_SIZE, TEXTURE_SIZE * 2, monster.right === 0, monster.pos.y]);
        }

        // Subjects
        for (let i = 0; i < game.subjects.length; i++) {
            let subject = game.subjects[i];
            if (!subject || !subject.type) // Corrupted
                continue;
            this.ySorted.push([IMGS_SUBJECT[subject.type - 1], subject.pos.x - CELL_SIZE / 2, subject.pos.y - CELL_SIZE, TEXTURE_SIZE, TEXTURE_SIZE , 0, subject.pos.y]);
        }

        // Sprite animations
        for (let i = 0; i < game.animations.length; i++) {
            let animation = game.animations[i];
            if (animation.interface_bind) {
                continue;
            }
            let img = animation.getFrame();
            this.ySorted.push([img, animation.pos.x - CELL_SIZE / 2, animation.pos.y, animation.box.x, animation.box.y , 0, 1000]);
        }

        // Sorting objects by Y-pos
        this.ySorted.sort(function(a, b) {
            return a[6] - b[6];
        });

        // Drawing sorted objects
        for (let x = 0; x < this.ySorted.length; x++) {
            let a = this.ySorted[x];
            this.image(a[0], a[1], a[2], a[3], a[4], a[5]);
        }

        // Gradient light
        let pixelSize = 2; // Size of cell of light grid
        for (let x1 = this.cam.x - 64; x1 <= this.cam.x + 64; x1 += pixelSize) {
            for (let y1 = this.cam.y - 64; y1 <= this.cam.y + 64; y1+= pixelSize) {
                let val = 0; // Light value
                let sum = 0; // Dist sum
                let pos = new Vec2(x1, y1);
                let cellPos = game.getCell(pos);

                // Neighbor cells
                for (let x = cellPos.x - 1; x <= cellPos.x + 1; x++) {
                    for (let y = cellPos.y - 1; y <= cellPos.y + 1; y++) {
                        let dist = pos.dist(new Vec2(x * 8 + 4, y * 8 + 4));
                        if (game.checkCell(new Vec2(x, y)) || dist >= 16)
                            continue;
                        val += game.getLight(new Vec2(x, y)) * (18 - dist);
                        sum += 18 - dist;
                    }
                }

                val /= sum;

                let alpha = (1 - (val / DIST_LIGHT));
                this.rect(x1, y1, pixelSize, pixelSize, "rgba(0,0,0," + alpha + ")");
            }
        }

        //// Interface ////
        this.cam = new Vec2(0, 0);
        this.center = new Vec2(0, 0);
        this.image(IMG_INTERFACE, 0, 0, 64 * 2, 64 * 2);

        // Mind
        this.rect(53 * 2, 55 * 2, game.player.mind * 10 / LIMIT_MIND * 2, 2, "rgb(0,100,200)");
        // Hp
        this.rect(18 * 2, 63 * 2, 2 * 2, - game.player.hp * 6 / LIMIT_HP * 2, "rgb(194, 29, 40)");
        // Oil
        this.rect(8 * 2, 63 * 2, 2 * 2, - game.player.oil * 6 / LIMIT_OIL * 2, "rgb(148, 133, 46)");
        // Matches
        for (let i = 0; i < game.player.matches; i++) {
            this.image(IMG_MATCH, (22 + i * 2)  * 2, 58 * 2, 2, 5 * 2);
        }
        // Ammo
        this.rect(2, 55 * 2, game.player.weapon.ammo * 10 / 5 * 2, 2, "rgb(0, 143, 39)");
        // Cooldown
        this.rect(2, 54 * 2, game.player.weapon.timeToCooldown * 10 / game.player.weapon.cooldownTime * 2 , 2, "rgb(0, 0, 0)");

        if (game.mentalDanger) {
            this.image(IMG_MENTAL_DANGER, 53 * 2, 49 * 2, 10 * 2, 5 * 2);
        }

        // Subjects
        for (let j = 0; j < 2; j++) {
            if (!game.player.subjects[j] || !game.player.subjects[j].type) // Empty slot
                continue;

            this.image(IMGS_SUBJECT[game.player.subjects[j].type - 1], (28 + j * 7)  * 2, 56 * 2, 8 * 2, 8 * 2)
        }

        // Spec Graves
        for (let i = 0; i < game.spec_graves_visited.length; i++) {
            if (game.spec_graves_visited[i] === 2) {
                this.image(IMGS_SPEC_MINI_GRAVE[i], (52 + 4 * i) * 2, 57 * 2, 3 * 2, 6 * 2);
            }
        }

        // Overlay
        this.image(IMG_INTERFACE_OVERLAY, 0, 0, 64 * 2, 64 * 2);

        // Animations
        for (let i = 0; i < game.animations.length; i++) {
            let animation = game.animations[i];
            if (!animation.interface_bind) {
                continue;
            }
            let img = animation.getFrame();
            this.image(img, animation.pos.x * 2, animation.pos.y * 2, animation.box.x * 2, animation.box.y * 2 , 0);
        }

        // Gameover screen
        if (game.player.status === 1) {
            this.image(IMG_DEAD, 0, 0, 64 * 2, 64 * 2);
        }
        if (game.player.status === 2) {
            this.image(IMG_DELIRIOUS, 0, 0, 64 * 2, 64 * 2);
        }
        if (game.player.status === 3) {
            this.image(IMG_WIN, 0, 0, 64 * 2, 64 * 2);
        }
        if (game.player.status === 4) {
            this.image(IMG_START_SCREEN, 0, 0, 64 * 2, 64 * 2);
        }
    }
}

module.exports = Draw
},{"./vec2":15}],7:[function(require,module,exports){


const Weapon = require("./weapon")
const Vec2 = require("./vec2")

// Player | monster
class Entity {
    constructor() {
        this.pos = new Vec2(0, 0); // Position
        this.gridPos = new Vec2(0, 0); // Position
        this.dir = 0; // Direction

        this.lamp = 1; // 1 - on, 0 - off
        this.distLight = DIST_LIGHT;

        this.hp = LIMIT_HP;
        this.oil = LIMIT_OIL;
        this.mind = LIMIT_MIND;
        this.matches = LIMIT_MATCHES;

        this.status = 0; // 0 - alive, 1 - dead, 2 - delirious, 3 - win

        this.protectionTime = 1; // Invulnerability after taking damage (parameter)
        this.protectionTimer = 0; // Invulnerability after taking damage (Timer)
        this.subjects = [undefined, undefined];

        this.weapon = new Weapon();

        // animation
        this.right = 1;
        this.animationType = -1; // 0 - standing, 1 - walking up, 2 - walking down, 3 - walking right, 4 - left
        this.animationFrame = 0; // from 0 to skol'ko est'
        this.animationTime = 0.3; // time per 1 animation frame
        this.animationTimer = 0; // timer

        // For monster
        this.monsterType = 0;
        this.horror = 0; // -mind per second

        this.attackRange = 5;
        this.damage = 1;

        this.grid_pos = null
    }

    set_animations(standing, walking) { // standing - [], walking - [[up], [down], [right]]
        this.animations = [standing, walking[0], walking[1], walking[2], walking[2]];
        this.cur_animation = this.animations[0];
    }

// Cooldowns, timers, etc
    step(dt) {

        // Protection timer
        this.protectionTimer -= dt;
        if (this.protectionTimer < 0) {
            this.protectionTimer = 0;
        }

        if (this.animationType < 0) {
            return;
        }

        // animation timer
        this.cur_animation = this.animations[this.animationType];
        this.animationTimer += dt;
        if (this.animationTimer >= this.cur_animation.frame_time) {
            this.animationTimer = 0;
            this.cur_animation.frame = (this.cur_animation.frame + 1) % this.cur_animation.frames_cnt;
        }
    }

    get_frame() {
        return this.cur_animation.frames[this.cur_animation.frame];
    }

// mind += delta
    change_mind(delta) {
        this.mind += delta;

        if (this.mind < EPS) {
            this.mind = 0;
            this.status = 2; // Delirium
        }
        if (this.mind > LIMIT_MIND) {
            this.mind = LIMIT_MIND;
        }
    }

// hp += delta
    change_hp(delta) {
        this.hp += delta;

        if (this.hp < EPS) {
            this.hp = 0;
            this.status = 1; // Death
        }
        if (this.hp > LIMIT_HP) {
            this.hp = LIMIT_HP;
        }
    }

// hp += delta
    hurt(damage) {
        if (this.protectionTimer === 0) { // protection after attacks
            this.change_hp(-damage);
            this.protect();
        }
    }

// oil += delta
    change_oil(delta) {
        this.oil += delta;

        if (this.oil < 0) {
            this.oil = 0;
            this.lamp = 0;
        }
        if (this.oil > LIMIT_OIL) {
            this.oil = LIMIT_OIL;
        }
    }

// Protection after attacks
    protect() {
        this.protectionTimer = this.protectionTime;
    }
}

module.exports = Entity
},{"./vec2":15,"./weapon":16}],8:[function(require,module,exports){

const Animation = require("./animation.js")
const Anime = require("./anime.js")
const Cell = require("./cell.js")
const Deque = require("./deque.js")
const Entity = require("./entity.js")
const LightSource = require("./lightSource.js")
const TemporalLightSource = require("./temporalLightSource.js")
const Vec2 = require("./vec2.js")
const Subject = require("./subject")
const Random = require("./random")


// Main class that controls everything

class Game {
    constructor() {
        // Filling grid
        this.grid = [];
        for (let x = 0; x < SIZE_X; x++) {
                this.grid.push([]);
                for (let y = 0; y < SIZE_Y; y++) {
                    this.grid[x].push(new Cell);
                }
        }

        // Setting player
        this.player = new Entity();
        this.player.pos = new Vec2(10, 10);
        this.player.gridPos = new Vec2(0, 0);

        // Player's animations
        let anm_standing = new Anime(0.5, ANM_PLAYER_STANDING);
        let anm_walking_right = new Anime(0.3, ANM_PLAYER_MOVING_RIGHT);
        let anm_walking_up = new Anime(0.3, ANM_PLAYER_MOVING_UP);
        let anm_walking_down = new Anime(0.3, ANM_PLAYER_MOVING_DOWN);
        this.player.set_animations(anm_standing, [anm_walking_up, anm_walking_down, anm_walking_right]);

        // Game progress
        this.spec_graves_visited = [0, 0, 0];
        this.spec_graves_visited_count = 0;
        this.gates_state = 0; // 1 - gates spawned, 2 - gates opened
        this.level = 0;

        // Spec graves cooldown
        this.specGraveCooldown = 5; // in sec
        this.specGraveTimer = this.specGraveCooldown;

        // Flickering
        this.flickeringCooldown = 0.1;
        this.flickeringTimer = this.flickeringCooldown;
        this.flickeringDelta = 0;
        this.flickeringMaxDelta = 0.5;
        this.flickeringD = 0.075;

        // Light
        this.spec_lights = [];
        this.temporalLightSources = [];

        // Monster array
        this.monsterTimer = 0;
        this.monsters = [];

        // Subjects array
        this.subjectTimer = 0;
        this.subjects = [];

        // Light sources array
        this.lightSources = [];

        this.animations = [];

        this.RELOAD = 0;

        this.mentalDanger = 0; // PLayer is taking mental damage
    }

    // Deals damage & makes sprite animation
    hurt(target, value) {
        if (target.protectionTimer === 0) {
            this.animations.push(new Animation(ANM_BLOOD, target.pos.plus(new Vec2(0, -8)), new Vec2(8, 8), 0.1));
            if (!target.monsterType) {
                this.animations.push(new Animation(ANM_DAMAGE, new Vec2(0, 0), new Vec2(64, 64), 0.3, 1));
            }
        }
        target.hurt(value);
    }

    // Checks is the cell is in bounds
    checkCell(pos) {
        if(pos.x < 0 || pos.y < 0 || pos.x >= SIZE_X || pos.y >= SIZE_Y)
            return 1;
        return 0;
    }

    // Checks is the cell is in bounds and in margin
    checkMargin(pos) {
        if(pos.x < MARGIN || pos.y < MARGIN || pos.x >= SIZE_X - MARGIN || pos.y >= SIZE_Y - MARGIN)
            return 1;
        return 0;
    }

    // In which cell is pos
    getCell(pos) {
        let cellPos = pos.div(new Vec2(8, 8));
        cellPos.x = Math.floor(cellPos.x);
        cellPos.y = Math.floor(cellPos.y);
        return cellPos;
    }

    // Gets visible light value for current cell
    getLight(pos) {
        let val = 0;
        if (!this.checkCell(pos))
            val = Math.max(this.grid[pos.x][pos.y].light + DIST_LIGHT - DIST_LOAD, 0);
        return val;
    }

    // Choose random grave texture
    random_grave_type() {
        let graves_cnt = IMGS_GRAVE.length;
        return Random.normalRoll(2, graves_cnt, 10);
    }

    // Choose random ground texture
    random_ground_type() {
        let grounds_cnt = IMGS_GROUND.length;
        return Random.normalRoll(1, grounds_cnt, 3);
    }

    // Choose random ground covering texture
    //     random_covering_type() {
    //         let covering_cnt = IMGS_COVERING.length;
    //         return normalRoll(1, covering_cnt, 2);
    //     }

    // Choose random monster texture
    random_monster_type() {
        let monster_cnt = IMGS_MONSTER.length;
        return Random.normalRoll(1, monster_cnt, 1);
    }

    clever_covering_type() {
        let roll = Random.random(1, 100);
        let grass_cnt = 5;
        let water_cnt = 2;
        let blood_cnt = 1;
        let sum = 0;
        if (roll < 90) { // Grass
            return Random.normalRoll(sum + 1, grass_cnt, 3);
        } else {
            sum += grass_cnt;
        }

        if (roll < 98) { // Water
            return Random.normalRoll(sum + 1, sum + water_cnt, 3);
        } else {
            sum += water_cnt;
        }

        if (roll < 100) {
            return Random.normalRoll(sum + 1, sum + blood_cnt, 3);
        }
    }

    subject_type() {
        let type = Random.random(1, 100);
        if (type <= 10) {
            type = SBJ_HEAL;
        } else if (type <= 35) {
            type = SBJ_WHISKEY;
        } else if (type <= 60) {
            type = SBJ_OIL;
        } else if (type <= 80) {
            type = SBJ_MATCHBOX;
        } else {
            type = SBJ_AMMO;
        }

        return type;
    }

    // Generates map
    initialGeneration() {
        // Initial graves (in each cell with some chance)
        for (let x = MARGIN - 1; x < SIZE_X - (MARGIN - 1); x++) {
            let y = (MARGIN - 1);
            let cell = this.grid[x][y];
            cell.grave = 1;
            cell.obstacle = 1;
        }
        for (let x = (MARGIN - 1); x < SIZE_X - (MARGIN - 1); x++) {
            let y = SIZE_Y - (MARGIN - 1) - 1;
            let cell = this.grid[x][y];
            cell.grave = 1;
            cell.obstacle = 1;
        }
        for (let y = (MARGIN - 1); y < SIZE_Y - (MARGIN - 1); y++) {
            let x = (MARGIN - 1);
            let cell = this.grid[x][y];
            cell.grave = 1;
            cell.obstacle = 1;
        }
        for (let y = (MARGIN - 1); y < SIZE_Y - (MARGIN - 1); y++) {
            let x = SIZE_X - (MARGIN - 1) - 1;
            let cell = this.grid[x][y];
            cell.grave = 1;
            cell.obstacle = 1;
        }
    }

    // Generates gates (always in the top), check for player near
    gates(x) {
        // Check for existing gates
        let gatesFound = 0;
        for (let x = 0; x < SIZE_X; x++) {
            for (let y = 0; y < SIZE_Y; y++) {
                if(this.grid[x][y].gates)
                    gatesFound = 1;
            }
        }

        if (gatesFound || this.gates_state) { // We don't need one more gates
            if (this.gates_state === 0)
                this.gates_state = 1; // Gates spawned
            return;
        }

        // Set gates_state
        this.gates_state = 1;

        // Gates itself
        this.grid[x][MARGIN - 1].gates = 1;
        this.grid[x + 1][MARGIN - 1].gates = 2;
        // Clear space under
        this.grid[x][MARGIN].obstacle = 0;
        this.grid[x + 1][MARGIN].obstacle = 0;
        this.grid[x][MARGIN].grave = 0;
        this.grid[x + 1][MARGIN].grave = 0;
        // Light
        this.spec_lights.push(new LightSource(new Vec2(x * 8 + 8, MARGIN * 8 - 8), 3));
    }

    // Generates the map
    generate() {
        // Initial graves (in each cell with some chance)

        let specGravesNum = 0;
        for (let x = 0; x < SIZE_X; x++) {
            for (let y = 0; y < SIZE_Y; y++) {
                let cell = this.grid[x][y];
                if (cell.light > 0) // Forbidden zone
                    continue;
                cell.ground = this.random_ground_type();
                cell.covering = this.clever_covering_type();
                if (cell.grave < 0) {
                    this.spec_graves_visited[-cell.grave - 1] = 0;
                    specGravesNum++;
                }
            }
        }

        for (let x = MARGIN; x < SIZE_X - MARGIN; x++) {
            for (let y = MARGIN; y < SIZE_Y - MARGIN; y++) {
                let cell = this.grid[x][y];
                if (cell.light > 0) // Forbidden zone
                    continue;
                if (!Random.random(0, 10)) { // Grave
                    cell.grave = this.random_grave_type();
                    cell.obstacle = 1;
                    cell.covering = 0;
                } else {
                    cell.grave = 0;
                    cell.obstacle = 0;
                }
            }
        }

        // Neighbor graves (finds random point, sets grave if this cell has neighbor)
        let neighbors = [
            new Vec2(1, 0),
            new Vec2(-1, 0),
            new Vec2(0, 1),
            new Vec2(0, -1)
        ];
        let neighborsDiagonal = [
            new Vec2(1, 1),
            new Vec2(-1, 1),
            new Vec2(1, -1),
            new Vec2(-1, -1)
        ];
        for (let i = 0; i < (SIZE_X * SIZE_Y); i++) {
            // Generate random point
            let pos = new Vec2(Random.random(MARGIN, SIZE_X - 1 - MARGIN), Random.random(MARGIN, SIZE_Y - 1 - MARGIN));

            // Number of neighbors
            let neighborsCount = 0;
            let neighborsDiagonalCount = 0;

            if(this.grid[pos.x][pos.y].light > 0) // Forbidden zone
                continue;

            // Check for neighbors
            // Close neighbors
            for (let j = 0; j < 4; j++) {
                let pos1 = pos.plus(neighbors[j]); // In this cell we check neighbor
                if(this.checkMargin(pos1)) // Cell out of borders or in margin
                    continue;
                if(this.grid[pos1.x][pos1.y].obstacle) // Neighbor found
                    neighborsCount++;
            }
            // Diagonal neighbors
            for (let j = 0; j < 4; j++) {
                let pos1 = pos.plus(neighborsDiagonal[j]); // In this cell we check neighbor
                if(this.checkMargin(pos1)) // Cell out of borders or in margin
                    continue;
                if(this.grid[pos1.x][pos1.y].obstacle) // Neighbor found
                    neighborsDiagonalCount++;
            }

            // If cell has neighbors we generate a grave
            if (neighborsCount === 1 && neighborsDiagonalCount <= 1 && this.grid[pos.x][pos.y].grave >= 0) {
                let cell = this.grid[pos.x][pos.y];
                cell.grave = this.random_grave_type();
                cell.obstacle = 1;
                cell.covering = 0;
            }
        }

        // Spec grave
        let spec_sum = this.spec_graves_visited[0] * this.spec_graves_visited[1] * this.spec_graves_visited[2];

        if (this.level < 3 && specGravesNum <= this.spec_graves_visited_count + 1 && spec_sum === 0) {
            let x = Random.random(MARGIN, SIZE_X - MARGIN - 1);
            let y = Random.random(MARGIN, SIZE_Y - MARGIN - 1);
            let cell = this.grid[x][y];

            for(let i = 0; i < 1000 && cell.light > 0; i++) {
                x = Random.random(MARGIN, SIZE_X - MARGIN - 1);
                y = Random.random(MARGIN, SIZE_Y - MARGIN - 1);
                cell = this.grid[x][y];
            }

            if (1) { // Spec grave!!!
                cell.grave = -this.level - 1;
                this.spec_graves_visited[-cell.grave - 1] = 1; // 1 - generated, 2 - visited
                cell.obstacle = 1;
                cell.covering = 0;
            }

            console.log('spec');
        }

        //// Cemetery gates ////
        if (this.spec_graves_visited_count >= 3)
            this.gates(Random.random(MARGIN + 1, SIZE_X - MARGIN - 2));

    }

    // Subjects-spawning management
    spawnSubjects() {
        //// Subjects (bonuses) ////
        this.subjectTimer -= DT; // dt
        // Despawn
        for (let i = 0; i < this.subjects.length; i++) {
            let subject = this.subjects[i];
            subject.gridPos = this.getCell(subject.pos);
            if (!subject.type || subject.pos.dist(this.player.pos) > 1000) {
                this.subjects.splice(i, 1);
            }
        }

        // Spawning new subjects
        for (let i = 0; i < 10; i++) { // We try to spawn subject for 10 times
            // Generate random point
            let pos = new Vec2(Random.random(0, SIZE_X - 1), Random.random(0, SIZE_Y - 1));

            // Checking for limitations
            if (this.subjects.length >= SUBJECT_LIMIT) // Too much subjects
                break;
            if (this.subjectTimer > 0) // We can't spawn subjects to often
                break;
            if (this.grid[pos.x][pos.y].obstacle) // Cell is not empty
                continue;
            if (this.grid[pos.x][pos.y].light > DIST_LIGHT - 1) // Visible zone
                continue;
            if (pos.x <= MARGIN && pos.y <= MARGIN || pos.x >= SIZE_X - MARGIN || pos.y >= SIZE_Y - MARGIN) // Out of cemetery
                continue;

            // Making a subject
            let subject = new Subject(pos.mult(new Vec2(8, 8)).plus(new Vec2(4, 4)));

            // Choosing type
            subject.type = this.subject_type();

            // Adding subject to array
            this.subjects.push(subject);

            // Timer
            this.subjectTimer = SUBJECT_PERIOD;
        }
    }

    // Moves object (collision)
    move(object, shift, flight) {
        let deltaPos = shift;
        let newPosX = object.pos.plus(new Vec2(0, 0)); newPosX.x += deltaPos.x;
        let newPosY = object.pos.plus(new Vec2(0, 0)); newPosY.y += deltaPos.y;
        let cellPosX = newPosX.div(new Vec2(8, 8)); // Cell
        let cellPosY = newPosY.div(new Vec2(8, 8)); // Cell
        cellPosX.x = Math.floor(cellPosX.x);
        cellPosX.y = Math.floor(cellPosX.y);
        cellPosY.x = Math.floor(cellPosY.x);
        cellPosY.y = Math.floor(cellPosY.y);
        if(cellPosX.x < 0 || cellPosX.y < 0 || cellPosX.x >= SIZE_X || cellPosX.y >= SIZE_Y || (!flight && this.grid[cellPosX.x][cellPosX.y].obstacle)){
            deltaPos.x = 0;
        }
        if(cellPosY.x < 0 || cellPosY.y < 0 || cellPosY.x >= SIZE_X || cellPosY.y >= SIZE_Y || (!flight && this.grid[cellPosY.x][cellPosY.y].obstacle)){
            deltaPos.y = 0;
        }
        object.pos = object.pos.plus(deltaPos);

        // Grid pos
        object.grid_pos = this.getCell(this.player.pos);
        return deltaPos.x || deltaPos.y;
    }

    // Player's movement & actions
    playerControl() {
        // Player movement
        let deltaPos = new Vec2(0, 0); // Shift for this step
        // Check keys
        this.player.dir = NONE;
        if (KEY_D) { // Right
            deltaPos.x += 1;
            this.player.dir = RIGHT;
            this.player.right = 1;
        }
        if (KEY_A) { // Left
            deltaPos.x -= 1;
            this.player.dir = LEFT;
            this.player.right = 0;
        }
        if (KEY_S) { // Down
            deltaPos.y += 1;
            this.player.dir = DOWN;
        }
        if (KEY_W) { // Up
            deltaPos.y -= 1;
            this.player.dir = UP;
        }
        this.player.animationType = this.player.dir;

        // Movement
        this.move(this.player, deltaPos)
        if ((KEY_D || KEY_A || KEY_S || KEY_W)) {
            if (window.SOUND_STEPS.isPlaying != 1) {
                window.SOUND_STEPS.play();
                window.SOUND_STEPS.isPlaying = 1;
                console.log('step');
            }
        }
        else {
            window.SOUND_STEPS.pause();
            window.SOUND_STEPS.isPlaying = 0;
            console.log('pause');
        }

        // Cooldowns
        this.player.step(DT);

        //// Lamp management ////
        // Consumption
        if (this.player.lamp)
            this.player.change_oil(-OIL_CONSUMPTION * DT);

        // Turning lamp off
        if (KEY_X && !KEY_X_PREV) {
            if (this.player.lamp)
                this.player.lamp = 0;
        }

        //// Match using (interacting) ////
        if (KEY_F && !KEY_F_PREV) {
            if (this.player.matches > 0) {
                window.SOUND_MATCH.play();
                this.player.lamp = 1;
                this.player.matches--;
                this.temporalLightSources.push(new TemporalLightSource(this.player.pos, 5, 2));
                this.animations.push(new Animation(ANM_MATCH, this.player.pos.plus(new Vec2(0, -5)), new Vec2(8, 8), 0.1)); // In game
                this.animations.push(new Animation(ANM_MATCH_BURNING, new Vec2(22 + (this.player.matches - 1) * 2 + 1, 57), new Vec2(3, 7), 0.1, 1)); // In interface

                // Lighting spec graves
                let pos = this.player.grid_pos;
                for (let x = pos.x - 1; x <= pos.x + 1; ++x) {
                    for (let y = pos.y - 1; y <= pos.y + 1; ++y) {
                        let cell = this.grid[x][y];
                        if (cell.grave < 0 && this.spec_graves_visited[-cell.grave - 1] === 1) { // spec grave

                            this.specGraveTimer = this.specGraveCooldown;
                            this.spec_graves_visited[-cell.grave - 1] = 2;
                            this.spec_lights.push(new LightSource(new Vec2(x * 8 + 4, y * 8 + 4), 2));
                            this.spec_graves_visited_count += 1;
                            this.animations.push(new Animation(ANM_IGNITION[-cell.grave - 1], new Vec2(x * 8 + 4, y * 8 - 8), new Vec2(8, 16), 0.1));
                            this.animations.push(new Animation(ANM_ACTIVE_GRAVE, new Vec2(x * 8 + 4, y * 8 - 8), new Vec2(8, 16), 0.15, 0, 1));
                            this.level++;
                            this.generate();
                        }
                    }
                }

                // Open gates
                for (let x = 0; x < SIZE_X; x++) {
                    for (let y = 0; y < SIZE_Y; y++) {
                        if (this.spec_graves_visited_count < 3) // Gates are not ready
                            break;

                        // Check for player
                        if (this.gates_state === 1 && this.grid[x][y].gates === 1 && this.player.pos.dist(new Vec2(x * 8 + 8, y * 8 + 8)) < 32) {
                            this.gates_state = 2; // Gates opened
                            this.animations.push(new Animation(ANM_GATES, new Vec2(x * 8 + 4, y * 8 - 8), new Vec2(16, 16), 0.3));
                        }

                        // Clean obstacles
                        if (this.gates_state === 2 && this.grid[x][y].gates) {
                            this.grid[x][y].obstacle = 0;
                        }
                    }
                }
            }
        }

        if (this.player.lamp)
            this.player.distLight = DIST_LIGHT;
        else
            this.player.distLight = 1;

        // Horror
        if (!this.player.lamp) {
            this.player.change_mind(-0.35 * DT);
            this.mentalDanger = 1;
        }

        //// Active subjects ////
        // Get subjects
        for (let i = 0; i < this.subjects.length; i++) {
            let subject = this.subjects[i];
            if (subject.pos.dist(this.player.pos) > 8) // Not close enough
                continue;

            // Checking slots
            for (let j = 0; j < 2; j++) {
                if (this.player.subjects[j] && this.player.subjects[j].type) // There is another subject in the slot
                    continue;

                this.player.subjects[j] = new Subject();
                this.player.subjects[j].type = subject.type;

                subject.type = undefined;
            }
        }

        // Use subjects
        let keys = [
            (KEY_1 && !KEY_1_PREV),
            (KEY_2 && !KEY_2_PREV)
        ];
        for (let i = 0; i < 2; i++) {
            if (!this.player.subjects[i] || !this.player.subjects[i].type) // Slot is empty
                continue;
            if (!keys[i]) // No command
                continue;

            // Current subject
            let subject = this.player.subjects[i];

            // Checking for subject type
            if (subject.type === SBJ_HEAL){
                this.player.change_hp(1);
            }
            if (subject.type === SBJ_OIL){
                this.player.change_oil(7);
            }
            if (subject.type === SBJ_WHISKEY){
                this.player.change_mind(6);
            }
            if (subject.type === SBJ_MATCHBOX){
                this.player.matches += 2;
                this.player.matches = Math.min(this.player.matches, LIMIT_MATCHES);
            }
            if (subject.type === SBJ_AMMO){
                this.player.weapon.ammo += 2;
                this.player.weapon.ammo = Math.min(this.player.weapon.ammo, this.player.weapon.ammoMax);
            }

            // Remove subject
            this.player.subjects[i] = undefined;
        }

        //// Weapon ////
        // Cooldown progress
        this.player.weapon.timeToCooldown -= DT;

        if (KEY_UP || KEY_DOWN || KEY_LEFT || KEY_RIGHT) {
            let dir = new Vec2();

            // Get direction
            if (KEY_UP)
                dir = new Vec2(0, -1);
            if (KEY_DOWN)
                dir = new Vec2(0, 1);
            if (KEY_LEFT)
                dir = new Vec2(-1, 0);
            if (KEY_RIGHT)
                dir = new Vec2(1, 0);
            if (KEY_ENTER) {
                this.RELOAD = 1;
            }

            if (this.player.weapon.timeToCooldown <= 0 && this.player.weapon.ammo > 0) { // Are we able to shoot
                window.SOUND_SHOOT.play();
                // Stupid collision check
                let pos = new Vec2(this.player.pos.x, this.player.pos.y);
                dir = dir.mult(new Vec2(2, 2));
                for (let i = 0; i < 30; i++) {
                    let hit = 0;
                    for (let j = 0; j < this.monsters.length; j++) {
                        // Current monster
                        let monster = this.monsters[j];
                        // Shift
                        pos = pos.plus(dir);
                        // Collision check
                        if (pos.dist(monster.pos) < 8) {
                            this.hurt(monster, this.player.weapon.damage);
                        }
                    }
                    if (hit)
                        break;
                }

                // Animation
                let curAnm = ANM_TRACER_UP; // Current animation
                if (KEY_UP)
                    curAnm = ANM_TRACER_UP;
                if (KEY_DOWN)
                    curAnm = ANM_TRACER_DOWN;
                if (KEY_LEFT)
                    curAnm = ANM_TRACER_LEFT;
                if (KEY_RIGHT)
                    curAnm = ANM_TRACER_RIGHT;
                this.animations.push(new Animation(curAnm, this.player.pos.plus(new Vec2(-28, -36)), new Vec2(64, 64), 0.1));
                this.animations.push(new Animation(ANM_PISTOL_SHOT, new Vec2(1, 47), new Vec2(13, 7), 0.1, 1, 0));


                // Modify cooldown & ammo
                this.player.weapon.timeToCooldown =  this.player.weapon.cooldownTime;
                this.player.weapon.ammo--;
            }
        }

        //// WIN ////
        if (this.player.pos.y < MARGIN * 8 - 8)
            this.player.status = 3;
    }

    // Monster management
    monstersControl() {
        //// Spawning & despawning ////
        this.monsterTimer -= DT;
        // Despawning monsters
        for (let i = 0; i < this.monsters.length; i++) {
            let monster = this.monsters[i];
            if (monster.hp <= 0 || monster.pos.dist(this.player.pos) > 1000) {
                // Drop items
                if (Random.random(0, 99) < 70) { // Chance 70%
                    let sbj = new Subject(); // Dropped subject
                    sbj.type = this.subject_type();
                    sbj.pos = monster.pos;
                    this.subjects.push(sbj);
                }
                this.monsters.splice(i, 1);
            }
        }

        // Spawning new monsters
        // We try to spawn monster for 10 times
        for (let i = 0; i < 10; i++) {
            // Generate random point
            let pos = new Vec2(Random.random(0, SIZE_X - 1), Random.random(0, SIZE_Y - 1));

            // Checking for limitations
            if(this.monsters.length >= MONSTER_LIMIT) // Too much monsters
                break;
            if(this.monsterTimer > 0) // We can't spawn monsters too often
                break;
            if(this.grid[pos.x][pos.y].obstacle) // Cell is not empty
                continue;
            if(this.grid[pos.x][pos.y].light > DIST_LIGHT - 1) // Visible zone
                continue;
            if (pos.x <= MARGIN && pos.y <= MARGIN || pos.x >= SIZE_X - MARGIN || pos.y >= SIZE_Y - MARGIN) // Out of cemetery
                continue;

            // Making a monster
            let monster = new Entity();
            monster.pos = pos.mult(new Vec2(8, 8)).plus(new Vec2(4, 4));
            monster.monsterType = this.random_monster_type();

            // Choosing animations
            let standing = [];
            let moving_up = [];
            let moving_down = [];
            let moving_right = [];
            if (monster.monsterType === MNS_ZOMBIE) {
                monster.horror = 0.2;
                monster.hp = Random.random(2, 3);
                standing = new Anime(0.5, ANM_ZOMBIE_STANDING);
                moving_up = new Anime(0.3, ANM_ZOMBIE_MOVING_UP);
                moving_down = new Anime(0.3, ANM_ZOMBIE_MOVING_DOWN);
                moving_right = new Anime(0.3, ANM_ZOMBIE_MOVING_RIGHT);
            }
            if (monster.monsterType === MNS_GHOST) {
                monster.horror = 0.3;
                monster.hp = Random.random(1, 3);
                standing = new Anime(0.5, ANM_GHOST_STANDING);
                moving_up = new Anime(0.3, ANM_GHOST_MOVING_UP);
                moving_down = new Anime(0.3, ANM_GHOST_MOVING_DOWN);
                moving_right = new Anime(0.3, ANM_GHOST_MOVING_RIGHT);
            }
            if (monster.monsterType === MNS_TENTACLE) {
                monster.horror = 0.7;
                monster.hp = Random.random(3, 4);
                standing = new Anime(0.5, ANM_WORM_STANDING);
                moving_up = new Anime(0.3, ANM_WORM_STANDING);
                moving_down = new Anime(0.3, ANM_WORM_STANDING);
                moving_right = new Anime(0.3, ANM_WORM_STANDING);
            }


            monster.set_animations(standing, [moving_up, moving_down, moving_right]);


            if (monster.monsterType === MNS_TENTACLE)
                monster.horror = 0.5;
            else
                monster.horror = 0.2;

            // Adding monster to array
            this.monsters.push(monster);

            // Timer
            this.monsterTimer = MONSTER_PERIOD;
        }

        //// Behavior ////
        for (let i = 0; i < this.monsters.length; i++) {
            // Get current monster
            let monster = this.monsters[i];
            monster.gridPos = this.getCell(monster.pos);
            let x1 = monster.pos.x;
            let y1 = monster.pos.y;

            // Cooldowns
            if (monster.monsterType === MNS_ZOMBIE) { // ZOMBIE
                // Movement
                let deltaPos = new Vec2(0, 0);
                // Check neighbor cells to find
                let neighbors = [
                    new Vec2(1, 0),
                    new Vec2(-1, 0),
                    new Vec2(0, 1),
                    new Vec2(0, -1)
                ];
                for (let j = 0; j < 4; j ++) {
                    let pos1 = monster.gridPos.plus(neighbors[j]);
                    if (this.checkCell(pos1) || this.grid[pos1.x][pos1.y].obstacle)
                        continue;
                    if (this.grid[pos1.x][pos1.y].zombieNav > this.grid[monster.gridPos.x][monster.gridPos.y].zombieNav)
                        deltaPos = deltaPos.plus(neighbors[j]);
                }

                let vel = 0.5;
                this.move(monster, deltaPos.mult(new Vec2(vel, vel)), 0);
            }
            else if (monster.monsterType === MNS_GHOST) { // GHOST
                // Movement
                let deltaPos = new Vec2(0, 0);
                // Check neighbor cells to find
                let neighbors = [
                    new Vec2(1, 0),
                    new Vec2(-1, 0),
                    new Vec2(0, 1),
                    new Vec2(0, -1)
                ];
                for(let j = 0; j < 4; j++) {
                    let pos1 = monster.gridPos.plus(neighbors[j]);
                    if (this.checkCell(pos1))
                        continue;
                    if(this.grid[pos1.x][pos1.y].ghostNav > this.grid[monster.gridPos.x][monster.gridPos.y].ghostNav)
                        deltaPos = deltaPos.plus(neighbors[j]);
                }
                let vel = 0.3;
                this.move(monster, deltaPos.mult(new Vec2(vel, vel)), 1);
            }

            let x2 = monster.pos.x;
            let y2 = monster.pos.y;

            if (x2 - x1 > 0) {
                monster.right = 1;
                monster.dir = RIGHT;
            }

            if (x2 - x1 < 0) {
                monster.right = 0;
                monster.dir = LEFT;
            }

            if (y2 - y1 > 0) {
                monster.dir = DOWN;
            }

            if (y2 - y1 < 0) {
                monster.dir = UP;
            }

            monster.animationType = monster.dir;
            monster.step(DT);

            // Horror
            if (this.grid[monster.gridPos.x][monster.gridPos.y].light > DIST_LIGHT - 1) {
                this.player.change_mind(-monster.horror * DT);
                this.mentalDanger = 1;
            }

            // Damage
            if (monster.pos.dist(this.player.pos) <= monster.attackRange) {
                this.hurt(this.player, monster.damage);
            }
        }
    }

    // Generate light around player (& other objects)
    setLight() {
        // Add player pos to light source
        this.lightSources.push(new LightSource(this.player.pos, this.player.distLight + this.flickeringDelta));

        // Turning off light
        for (let x = 0; x < SIZE_X; x++) {
            for (let y = 0; y < SIZE_Y; y++) {
                this.grid[x][y].light = 0;
            }
        }

        for (let i = 0; i < this.spec_lights.length; i++) {
            this.lightSources.push(this.spec_lights[i]);
        }

        // BFS deque
        let deque = new Deque();

        // Adding initial cells
        for (let i = 0; i < this.lightSources.length; i++) {
            // Current light source
            let lightSource = this.lightSources[i];
            let cellPos = this.getCell(lightSource.pos);
            for (let x = cellPos.x - 1; x <= cellPos.x + 1; x++) {
                for (let y = cellPos.y - 1; y <= cellPos.y + 1; y++) {
                    let dist = lightSource.pos.dist(new Vec2(x * 8 + 4, y * 8 + 4));
                    if (this.checkCell(new Vec2(x, y)) || dist > 16)
                        continue;
                    this.grid[x][y].light = Math.max (this.grid[x][y].light, lightSource.power - DIST_LIGHT + DIST_LOAD + 1 - dist / 8);
                    deque.addBack(new Vec2(x, y));
                }
            }
        }

        // Temporal light sources
        for (let i = 0; i < this.temporalLightSources.length; i++) {
            // Current light source
            let lightSource = this.temporalLightSources[i];
            lightSource.step(DT);
            let cellPos = this.getCell(lightSource.pos);

            for (let x = cellPos.x - 1; x <= cellPos.x + 1; x++) {
                for (let y = cellPos.y - 1; y <= cellPos.y + 1; y++) {

                    let dist = lightSource.pos.dist(new Vec2(x * 8 + 4, y * 8 + 4));
                    if (this.checkCell(new Vec2(x, y)) || dist > 16)
                        continue;
                    this.grid[x][y].light = Math.max(this.grid[x][y].light, lightSource.power - DIST_LIGHT + DIST_LOAD + 1 - dist / 8);
                    deque.addBack(new Vec2(x, y));
                }
            }

            if (lightSource.alive === 0)
                this.temporalLightSources.splice(i, 1);
        }

        // Clean lightSources
        this.lightSources = [];

        // BFS itself
        let neighbors = [
            new Vec2(1, 0),
            new Vec2(-1, 0),
            new Vec2(0, 1),
            new Vec2(0, -1)
        ];
        while (deque.peekFront()) {
            let pos = deque.peekFront().clone();
            deque.removeFront();
            if(this.grid[pos.x][pos.y].light < 0)
                this.grid[pos.x][pos.y].light = 0;
            if (this.grid[pos.x][pos.y].light <= 0)
                continue;

            let deltaLight = 1;
            if (this.grid[pos.x][pos.y].obstacle)
                deltaLight = 3;
            for (let i = 0; i < 4; i++) {
                let pos1 = pos.plus(neighbors[i]);
                if (this.checkCell(pos1) || this.grid[pos1.x][pos1.y].light > this.grid[pos.x][pos.y].light - deltaLight)
                    continue;
                this.grid[pos1.x][pos1.y].light = this.grid[pos.x][pos.y].light - deltaLight;
                deque.addBack(pos1);
            }
        }
    }

    // Sprite animations
    manageAnimations() {
        // Step
        for (let i = 0; i < this.animations.length; i++) {
            this.animations[i].step();
        }
        // Delete
        for (let i = 0; i < this.animations.length; i++) {
            if (!this.animations[i].alive) {
                this.animations.splice(i, 1);
                i--;
            }
        }
    }

    cooldowns() {
        // Spec graves
        this.specGraveTimer -= DT;
        if (this.specGraveTimer < 0)
            this.specGraveTimer = 0;

        // Flickering
        this.flickeringTimer -= DT;
        if (this.flickeringTimer <= 0) {
            this.flickeringTimer = this.flickeringCooldown;
            this.flickeringDelta += Random.random(-1, 1) * this.flickeringD;
            this.flickeringDelta = Math.min(Math.max(this.flickeringDelta, -this.flickeringMaxDelta), this.flickeringMaxDelta);
        }
    }

    // Pathfinding, DA HARDKOD NO VY VOOBSHE ETOT EBANYI PROEKT VIDELI, TUT V ODNOM ETOM FAILE 1000 STROK NAHUI
    pathfinding() {
        // ZOMBIE
        // Clearing navigating map
        for (let x = 0; x < SIZE_X; x++) {
            for (let y = 0; y < SIZE_Y; y++) {
                this.grid[x][y].zombieNav = 0;
            }
        }
        // BFS deque
        let deque = new Deque();
        let x = this.getCell(this.player.pos).x;
        let y = this.getCell(this.player.pos).y;

        this.grid[x][y].zombieNav = DIST_LOAD + 1;
        deque.addBack(new Vec2(x, y));

        // BFS itself
        let neighbors = [
            new Vec2(1, 0),
            new Vec2(-1, 0),
            new Vec2(0, 1),
            new Vec2(0, -1)
        ];

        while (deque.peekFront()) {
            let pos = deque.peekFront().clone();
            deque.removeFront();
            if(this.grid[pos.x][pos.y].zombieNav < 0)
                this.grid[pos.x][pos.y].zombieNav = 0;
            if (this.grid[pos.x][pos.y].zombieNav <= 0)
                continue;

            let deltaNav = 1;
            if (this.grid[pos.x][pos.y].obstacle)
                deltaNav = 1000;
            for (let i = 0; i < 4; i++) {
                let pos1 = pos.plus(neighbors[i]);
                if (this.checkCell(pos1) || (this.grid[pos1.x][pos1.y].zombieNav >= this.grid[pos.x][pos.y].zombieNav - deltaNav))
                    continue;
                this.grid[pos1.x][pos1.y].zombieNav = this.grid[pos.x][pos.y].zombieNav - deltaNav;
                deque.addBack(pos1);
            }
        }

        // Ghost

        // Clearing
        for (let x = 0; x < SIZE_X; x++) {
            for (let y = 0; y < SIZE_Y; y++) {
                this.grid[x][y].ghostNav = 0;
            }
        }
        // BFS deque
        deque = new Deque();
        x = this.getCell(this.player.pos).x;
        y = this.getCell(this.player.pos).y;

        this.grid[x][y].ghostNav = DIST_LOAD + 1;
        deque.addBack(new Vec2(x, y));

        // BFS itself
        while (deque.peekFront()) {
            let pos = deque.peekFront().clone();
            deque.removeFront();
            if(this.grid[pos.x][pos.y].ghostNav < 0)
                this.grid[pos.x][pos.y].ghostNav = 0;
            if (this.grid[pos.x][pos.y].ghostNav <= 0)
                continue;

            let deltaNav = 1;

            for (let i = 0; i < 4; i++) {
                let pos1 = pos.plus(neighbors[i]);
                if (this.checkCell(pos1) || (this.grid[pos1.x][pos1.y].ghostNav >= this.grid[pos.x][pos.y].ghostNav - deltaNav))
                    continue;
                this.grid[pos1.x][pos1.y].ghostNav = this.grid[pos.x][pos.y].ghostNav - deltaNav;
                deque.addBack(pos1);
            }
        }
    }

    // Function called in each iteration
    step() {
        if (this.player.status === 0) { // If player is alive
            this.mentalDanger = 0;
            this.pathfinding();
            this.playerControl();
            this.monstersControl();
            this.setLight();
            //this.generate();
            this.spawnSubjects();
            this.manageAnimations();
            this.cooldowns();
        }
        if (KEY_ENTER) {
            this.RELOAD = 1;
        }
    }

    spawnPlayer(pos) {
        let gridPos = this.getCell(pos);

        this.player.pos = pos;
        this.player.gridPos = gridPos;

        // Clearing area
        for (let x = Math.max(0, gridPos.x - 1); x <= Math.min(SIZE_X, gridPos.x + 1); x++) {
            for (let y = Math.max(0, gridPos.y - 1); y <= Math.min(SIZE_Y, gridPos.y + 1); y++) {
                this.grid[x][y].grave = 0;
                this.grid[x][y].obstacle = 0;
            }
        }

        // Spawning gates
        this.gates(this.getCell(pos).x - 1);
    }
}

module.exports = Game
},{"./animation.js":2,"./anime.js":3,"./cell.js":4,"./deque.js":5,"./entity.js":7,"./lightSource.js":9,"./random":12,"./subject":13,"./temporalLightSource.js":14,"./vec2.js":15}],9:[function(require,module,exports){
// Light source
class LightSource {
    constructor(pos, power) {
        if (pos)
            this.pos = pos.clone();
        else
            this.pos = new Vec2(0, 0);
        if (power)
            this.power = power;
        else
            this.power = 0;
    }
}

module.exports = LightSource
},{}],10:[function(require,module,exports){

const Parameters = require("./parameters")
const Game = require("./game.js")
const Draw = require("./draw.js")
const Vec2 = require("./vec2.js")


window.addEventListener("load", function() {
    let game = new Game();
    let draw = new Draw(CTX);

    game.initialGeneration();
    game.generate();
    game.spawnPlayer(new Vec2(SIZE_X * 8 / 2, 10 + MARGIN * 8));
    game.player.status = 4;



    function step() {
        window.game = game; // For checking from console

        game.step();
        draw.draw(game);

        if (KEY_MINUS) {
            VOLUME = Math.max(0, VOLUME - 0.1);
        }
        if (KEY_PLUS) {
            VOLUME = Math.min(1, VOLUME + 0.1);
        }

        // Previous keys
        KEY_W_PREV = KEY_W;
        KEY_A_PREV = KEY_A;
        KEY_S_PREV = KEY_S;
        KEY_D_PREV = KEY_D;
        KEY_X_PREV = KEY_X;
        KEY_F_PREV = KEY_F;
        KEY_1_PREV = KEY_1;
        KEY_2_PREV = KEY_2;
        KEY_UP_PREV = KEY_UP;
        KEY_DOWN_PREV = KEY_DOWN;
        KEY_LEFT_PREV = KEY_LEFT;
        KEY_RIGHT_PREV = KEY_RIGHT;

        if (game.RELOAD === 1) {
            SOUND_MUSIC.pause();
            SOUND_MUSIC.play();

            game = new Game();
            game.initialGeneration();
            game.generate();
            game.spawnPlayer(new Vec2(SIZE_X * 8 / 2, 10 + MARGIN * 8));
        }
    }

    var interval = setInterval(step, DT * 1000);
})
},{"./draw.js":6,"./game.js":8,"./parameters":11,"./vec2.js":15}],11:[function(require,module,exports){
'use strict'
const {Howl, Howler} = require('howler');

//// CONSTANTS ////
// Directions
window.NONE = 0
window.RIGHT = 3;
window.DOWN = 2;
window.LEFT = 4;
window.UP = 1;

// Subjects' types
window.SBJ_HEAL = 1;
window.SBJ_OIL = 2;
window.SBJ_WHISKEY = 3;
window.SBJ_MATCHBOX = 4;
window.SBJ_AMMO = 5;

// Monsters' names

window.MNS_ZOMBIE = 1;
window.MNS_GHOST = 2;
window.MNS_TENTACLE = 3;

//// GAME PREFERENCES ////
window.DT = 0.050; // Tick time in seconds
window.CELL_SIZE = 8;
window.TEXTURE_SIZE = 8;

window.EPS = 0.0001;

// Limitations for player
window.LIMIT_HP = 3;
window.LIMIT_OIL = 10;
window.LIMIT_MIND = 10;
window.LIMIT_MATCHES = 3;

window.OIL_CONSUMPTION = 0.2;
window.DIST_LIGHT = 7;
window.DIST_LOAD = 12;

window.MONSTER_LIMIT = 4; // Maximum number of monsters
window.MONSTER_PERIOD = 7; // Time between monsters spawn

window.SUBJECT_LIMIT = 5.5; // Maximum number of subjects
window.SUBJECT_PERIOD = 1.65; // Time between subjects spawn

// Map parameters
window.MARGIN = 3; // Cells on map's sides, that are not changing
window.SIZE_X = 20 + MARGIN * 2;
window.SIZE_Y = 20 + MARGIN * 2;

// Music
window.VOLUME = 1;

// Sounds
// Loop
window.SOUND_MUSIC = new Howl({
    src: ['music/main_theme.mp3'],
    loop: true
});
window.SOUND_STEPS = new Howl({
    src: ['sounds/steps.wav'],
    loop: true});
// Single
window.SOUND_SHOOT = new Howl({src: ['sounds/shoot.wav'],});
window.SOUND_MATCH= new Howl({src: ['sounds/match.wav'],});

// Generation
window.SPEC_GRAVE_RADIUS = 10;
window.HARDNESS = 0;

// consts
window.LIFE_ETERNAL = -12222;


//// DRAW PREFERENCES ////
window.SCALE = 10; // 1 Cell in px
while (64 * SCALE <= Math.min(window.innerHeight, window.innerWidth)) {
    SCALE += 1;
}
SCALE = 7;

// Canvas
window.SCREEN = document.getElementById("screen");
SCREEN.width = SCREEN.height = 128 * SCALE;
window.CTX = SCREEN.getContext("2d");

// Images
function getImg(src) { // Load images
    let img = new Image();
    img.src = src;
    return img;
}

// Loading current imgs
window.IMGS_GROUND = [
    getImg("textures/grounds/ground1.png"),
    getImg("textures/grounds/ground2.png")
];

window.IMGS_COVERING = [
    getImg("textures/coverings/covering1.png"),
    getImg("textures/coverings/covering2.png"),
    getImg("textures/coverings/covering3.png"),
    getImg("textures/coverings/covering4.png"),
    getImg("textures/coverings/covering5.png"),
    getImg("textures/coverings/covering6.png"),
    getImg("textures/coverings/covering7.png"),
    getImg("textures/coverings/covering8.png")
];

window.IMGS_SPEC_GRAVE = [
    getImg("textures/spec_graves/spec_grave1.png"),
    getImg("textures/spec_graves/spec_grave2.png"),
    getImg("textures/spec_graves/spec_grave3.png")
];

window.IMGS_SPEC_MINI_GRAVE = [
    getImg("textures/spec_graves/spec_mini_grave1.png"),
    getImg("textures/spec_graves/spec_mini_grave2.png"),
    getImg("textures/spec_graves/spec_mini_grave3.png")
];

window.IMGS_GRAVE = [
    getImg("textures/graves/grave1.png"),
    getImg("textures/graves/grave2.png"),
    getImg("textures/graves/grave3.png"),
    getImg("textures/graves/grave4.png"),
    getImg("textures/graves/grave5.png"),
    getImg("textures/graves/grave6.png"),
    getImg("textures/graves/grave7.png"),
    getImg("textures/graves/grave8.png"),
    getImg("textures/graves/grave9.png"),
    getImg("textures/graves/grave10.png"),
    getImg("textures/graves/grave11.png"),
];

window.IMGS_GATES = [
    getImg("textures/gates1.png"),
    getImg("textures/gates2.png")
];

window.IMGS_MONSTER = [
    getImg("textures/monsters/monster1.png"),
    getImg("textures/monsters/monster2.png"),
    getImg("textures/monsters/monster3.png")
];

window.IMGS_SUBJECT = [
    getImg("textures/subjects/heal.png"),
    getImg("textures/subjects/oil.png"),
    getImg("textures/subjects/whiskey.png"),
    getImg("textures/subjects/matchbox.png"),
    getImg("textures/subjects/ammo.png")
];

// Player animation
window.ANM_PLAYER_STANDING = [
    getImg("textures/player/player_standing_0.png"),
    getImg("textures/player/player_standing_1.png")
];

window.ANM_PLAYER_MOVING_RIGHT = [
    getImg("textures/player/player_moving_right_0.png"),
    getImg("textures/player/player_moving_right_1.png")
];

window.ANM_PLAYER_MOVING_UP = [
    getImg("textures/player/player_moving_up_0.png"),
    getImg("textures/player/player_moving_up_1.png")
];

window.ANM_PLAYER_MOVING_DOWN = [
    getImg("textures/player/player_moving_down_0.png"),
    getImg("textures/player/player_moving_down_1.png")
];

// MONSTERS

window.ANM_ZOMBIE_STANDING = [
    getImg("textures/monsters/zombie_standing_0.png"),
    getImg("textures/monsters/zombie_standing_1.png")
];

window.ANM_ZOMBIE_MOVING_UP = [
    getImg("textures/monsters/zombie_moving_up_0.png"),
    getImg("textures/monsters/zombie_moving_up_1.png")
];

window.ANM_ZOMBIE_MOVING_DOWN = [
    getImg("textures/monsters/zombie_moving_down_0.png"),
    getImg("textures/monsters/zombie_moving_down_1.png")
];

window.ANM_ZOMBIE_MOVING_RIGHT = [
    getImg("textures/monsters/zombie_moving_right_0.png"),
    getImg("textures/monsters/zombie_moving_right_1.png")
];

// GATES
window.ANM_GATES = [
    getImg("textures/particles/gates/gates0.png"),
    getImg("textures/particles/gates/gates1.png"),
    getImg("textures/particles/gates/gates2.png"),
    getImg("textures/particles/gates/gates3.png")
];

window.ANM_GHOST_STANDING = [
    getImg("textures/monsters/ghost_standing_0.png"),
    getImg("textures/monsters/ghost_standing_1.png")
];

window.ANM_GHOST_MOVING_UP = [
    getImg("textures/monsters/ghost_moving_up_0.png"),
    getImg("textures/monsters/ghost_moving_up_1.png"),
    getImg("textures/monsters/ghost_moving_up_2.png"),
    getImg("textures/monsters/ghost_moving_up_3.png")

];

window.ANM_GHOST_MOVING_DOWN = [
    getImg("textures/monsters/ghost_moving_down_0.png"),
    getImg("textures/monsters/ghost_moving_down_1.png"),
    getImg("textures/monsters/ghost_moving_down_2.png"),
    getImg("textures/monsters/ghost_moving_down_3.png")
];

window.ANM_GHOST_MOVING_RIGHT = [
    getImg("textures/monsters/ghost_moving_right_0.png"),
    getImg("textures/monsters/ghost_moving_right_1.png"),
    getImg("textures/monsters/ghost_moving_right_2.png"),
    getImg("textures/monsters/ghost_moving_right_3.png"),
];

window.ANM_WORM_STANDING = [
    getImg("textures/monsters/worm_standing_0.png"),
    getImg("textures/monsters/worm_standing_1.png"),
    getImg("textures/monsters/worm_standing_2.png"),
    getImg("textures/monsters/worm_standing_3.png")
]

// ===================

window.IMG_MONSTER0 = getImg("textures/monsters/zombie_standing_0.png");
window.IMG_SHADOW = getImg("textures/shadow.png");
window.IMG_INTERFACE = getImg("textures/interface/interface.png");
window.IMG_INTERFACE_OVERLAY = getImg("textures/interface/interfaceOverlay.png");
window.IMG_MATCH = getImg("textures/interface/match.png");
window.IMG_MENTAL_DANGER = getImg("textures/interface/mental_danger.png");

// Endgame screens
window.IMG_DEAD = getImg("textures/interface/deathscreen.png");
window.IMG_DELIRIOUS = getImg("textures/interface/deliriumscreen.png");
window.IMG_WIN = getImg("textures/interface/winscreen.png");
window.IMG_START_SCREEN = getImg("textures/interface/startscreen.png");

// Sprite animations
window.ANM_BLOOD = [
    getImg("textures/particles/blood/blood0.png"),
    getImg("textures/particles/blood/blood1.png"),
    getImg("textures/particles/blood/blood2.png")
];

window.ANM_IGNITION_RED = [
    getImg("textures/particles/ignition/ignition_red_0.png"),
    getImg("textures/particles/ignition/ignition_red_1.png"),
    getImg("textures/particles/ignition/ignition_red_2.png"),
    getImg("textures/particles/ignition/ignition_red_3.png"),
    getImg("textures/particles/ignition/ignition_red_4.png"),
    getImg("textures/particles/ignition/ignition_red_5.png"),
];

window.ANM_IGNITION_GREEN = [
    getImg("textures/particles/ignition/ignition_green_0.png"),
    getImg("textures/particles/ignition/ignition_green_1.png"),
    getImg("textures/particles/ignition/ignition_green_2.png"),
    getImg("textures/particles/ignition/ignition_green_3.png"),
    getImg("textures/particles/ignition/ignition_green_4.png"),
    getImg("textures/particles/ignition/ignition_green_5.png"),
];

window.ANM_IGNITION_BLUE = [
    getImg("textures/particles/ignition/ignition_blue_0.png"),
    getImg("textures/particles/ignition/ignition_blue_1.png"),
    getImg("textures/particles/ignition/ignition_blue_2.png"),
    getImg("textures/particles/ignition/ignition_blue_3.png"),
    getImg("textures/particles/ignition/ignition_blue_4.png"),
    getImg("textures/particles/ignition/ignition_blue_5.png"),
];

window.ANM_IGNITION = [ANM_IGNITION_RED, ANM_IGNITION_GREEN, ANM_IGNITION_BLUE];

window.ANM_MATCH = [
    getImg("textures/particles/match/match0.png"),
    getImg("textures/particles/match/match1.png"),
    getImg("textures/particles/match/match2.png")
];

window.ANM_MATCH_BURNING = [
    getImg("textures/particles/match_burn/match_burn_0.png"),
    getImg("textures/particles/match_burn/match_burn_1.png"),
    getImg("textures/particles/match_burn/match_burn_2.png"),
    getImg("textures/particles/match_burn/match_burn_3.png"),
    getImg("textures/particles/match_burn/match_burn_4.png")
];

window.ANM_ACTIVE_GRAVE = [
    getImg("textures/particles/active_grave/active_grave_0.png"),
    getImg("textures/particles/active_grave/active_grave_1.png"),
    getImg("textures/particles/active_grave/active_grave_2.png"),
    getImg("textures/particles/active_grave/active_grave_3.png"),
    getImg("textures/particles/active_grave/active_grave_4.png")
];

window.ANM_PISTOL_SHOT = [
    getImg("textures/interface/pistol_shot/pistol_0.png"),
    getImg("textures/interface/pistol_shot/pistol_1.png"),
    getImg("textures/interface/pistol_shot/pistol_2.png"),
    getImg("textures/interface/pistol_shot/pistol_3.png"),
    getImg("textures/interface/pistol_shot/pistol_4.png")
];

window.ANM_TRACER_LEFT = [
    getImg("textures/particles/tracer/tracer_left.png")
];
window.ANM_TRACER_RIGHT = [
    getImg("textures/particles/tracer/tracer_right.png")
];
window.ANM_TRACER_UP = [
    getImg("textures/particles/tracer/tracer_up.png")
];
window.ANM_TRACER_DOWN = [
    getImg("textures/particles/tracer/tracer_down.png")
];

// Damage animation
window.ANM_DAMAGE = [
    getImg("textures/particles/damage/damage0.png"),
    getImg("textures/particles/damage/damage1.png"),
    getImg("textures/particles/damage/damage2.png"),
    getImg("textures/particles/damage/damage3.png")
];

//// KEY CONFIG ////
// Keys (0 - released, 1 - pressed)
window.KEY_W = 0; window.KEY_W_PREV = 0;
window.KEY_A = 0; window.KEY_A_PREV = 0;
window.KEY_S = 0; window.KEY_S_PREV = 0;
window.KEY_D = 0; window.KEY_D_PREV = 0;
window.KEY_X = 0; window.KEY_X_PREV = 0;
window.KEY_F = 0; window.KEY_F_PREV = 0;
window.KEY_1 = 0; window.KEY_1_PREV = 0;
window.KEY_2 = 0; window.KEY_2_PREV = 0;
window.KEY_UP = 0; window.KEY_UP_PREV = 0;
window.KEY_DOWN = 0; window.KEY_DOWN_PREV = 0;
window.KEY_LEFT = 0; window.KEY_LEFT_PREV = 0;
window.KEY_RIGHT = 0; window.KEY_RIGHT_PREV = 0;
window.KEY_ENTER = 0; window.KEY_ENTER_PREV = 0;
window.KEY_PLUS = 0; window.KEY_PLUS_PREV = 0;
window.KEY_MINUS = 0; window.KEY_MINUS_PREV = 0;

function checkKey(e, t) {
    if(e.keyCode == 87)
        KEY_W = t;	
    if(e.keyCode == 65)
        KEY_A = t;  
    if(e.keyCode == 83)
        KEY_S = t;
    if(e.keyCode == 68)
        KEY_D = t;
    if(e.keyCode == 88)
        KEY_X = t;
    if(e.keyCode == 70)
        KEY_F = t;
    if(e.keyCode == 49)
        KEY_1 = t;
    if(e.keyCode == 50)
        KEY_2 = t;
    if(e.keyCode == 37)
        KEY_LEFT = t;
    if(e.keyCode == 38)
        KEY_UP = t;
    if(e.keyCode == 39)
        KEY_RIGHT = t;
    if(e.keyCode == 40)
        KEY_DOWN = t;
    if (e.keyCode == 13)
        KEY_ENTER = t;
    if (e.keyCode == 189)
        KEY_MINUS = t;
    if (e.keyCode == 187)
        KEY_PLUS = t;
    
}

window.addEventListener('keydown', checkDown,false);
function checkDown(e) {
   
    // Checking for buttons pressed
    checkKey(e, 1);
    if (e.keyCode >= 37 && e.keyCode <= 40) {
        e.preventDefault();
    }
}

window.addEventListener('keyup', checkUp,false);
function checkUp(e) {
   
    // Checking for buttons pressed
    checkKey(e, 0);
}
},{"howler":1}],12:[function(require,module,exports){

//// RANDOM ////

class Random {
    static random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    static random_float(min, max) {
        return (Math.random() * (max - min) + min);
    }

    static normalDistribution(min, max, iterations) {
        let sum = 0;
        for (let i = 0; i < iterations; i++)
            sum += this.random(min, max);
        return Math.round(sum / iterations);
    }

    static normalRoll(min, max, iterations) { // gives value from min to max with normal distribution
        let roll = this.normalDistribution(-max + min, +max - min, iterations);
        return Math.abs(roll) + min;
    }
}

module.exports = Random
},{}],13:[function(require,module,exports){

const Vec2 = require("./vec2")

class Subject {
    constructor(pos) {
        this.type = 0; // See types in parameters.js
        if (pos)
            this.pos = pos;
        else
            this.pos = new Vec2(0, 0);
    }
}

module.exports = Subject
},{"./vec2":15}],14:[function(require,module,exports){

const Vec2 = require("./vec2")

class TemporalLightSource {
    constructor(pos, power, lifespan) {
            if (pos)
                this.pos = pos.clone();
            else
                this.pos = new Vec2(0, 0);
            if (power)
                this.power = power;
            else
                this.power = 0;
            if (lifespan) {
                this.lifespan = lifespan;
                this.life = this.lifespan;
                this.initialPower = this.power;
            } else {
                this.life = 0;
                this.alive = 0;
            }

            this.alive = 1;
    }

    // Fading
    step(dt) {
        this.life -= dt;
        if (this.life <= 0) {
            this.life = 0;
            this.alive = 0;
        }

        this.power = Math.floor(this.initialPower * this.life / this.lifespan)
    }
}

module.exports = TemporalLightSource
},{"./vec2":15}],15:[function(require,module,exports){
//// 2D vector ////
class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    plus(a) {
        return new Vec2(this.x + a.x, this.y + a.y);
    }

    minus(a) {
        return new Vec2(this.x - a.x, this.y - a.y);
    }

    mult(a) {
        return new Vec2(this.x * a.x, this.y * a.y);
    }

    div(a) {
        return new Vec2(this.x / a.x, this.y / a.y);
    }

    dist(a) {
        let x = this.x - a.x;
        let y = this.y - a.y;
        return Math.abs(x) + Math.abs(y);
    }

    clone() {
        return new Vec2(this.x, this.y)
    }
}

module.exports = Vec2
},{}],16:[function(require,module,exports){
// Weapon
class Weapon {
    constructor() {
        this.damage = 1;
        // Ammo
        this.ammoMax = 5;
        this.ammo = this.ammoMax;
        // Cooldown
        this.cooldownTime = 1;
        this.timeToCooldown = this.cooldownTime;
    }
}

module.exports = Weapon
},{}]},{},[10]);
