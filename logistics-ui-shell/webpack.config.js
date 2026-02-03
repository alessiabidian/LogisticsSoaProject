const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({

  remotes: {
    "mfe1": "http://localhost:4201/remoteEntry.js",
  },

  shared: {
    // Explicitly share core libs to prevent "function is not a function" error
    "@angular/core": { singleton: true, strictVersion: true, requiredVersion: 'auto', eager: true },
    "@angular/common": { singleton: true, strictVersion: true, requiredVersion: 'auto', eager: true },
    "@angular/common/http": { singleton: true, strictVersion: true, requiredVersion: 'auto', eager: true },
    "@angular/router": { singleton: true, strictVersion: true, requiredVersion: 'auto', eager: true },
    "@angular/platform-browser": { singleton: true, strictVersion: true, requiredVersion: 'auto', eager: true },
    
    // Share other libs without eager loading
    ...shareAll({ singleton: true, strictVersion: false, requiredVersion: 'auto' })
  },

});
