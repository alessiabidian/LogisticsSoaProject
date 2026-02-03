const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({

  name: 'logistics-ui-shop',

  exposes: {
    './Routes': './src/app/app.routes.ts',
    './FleetComponent': './src/app/components/fleet/fleet.ts', 
    './ShipmentListComponent': './src/app/components/shipment-list/shipment-list.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: false, requiredVersion: 'auto' }),
  },

});
