# How to Build Micro-Frontends with Angular and Webpack Module Federation

## 1. Introduction

As enterprise applications grow, monolithic frontends often become development bottlenecks. Large codebases lead to slow build times, tight coupling, and coordination headaches between teams.

**Micro-Frontend Architecture** solves this by splitting a large application into smaller, independent applications. These "Micro-Frontends" can be developed, deployed, and tested separately, yet they appear as a single, unified application to the end-user.

This tutorial guides you through implementing this architecture using **Angular** and **Webpack 5 Module Federation**.

## 2. Core Concepts

Before writing code, it is essential to understand the two main roles in Module Federation:

1. **The Host (Shell)**: This is the main container application. It handles the core layout (navigation, authentication) and is responsible for dynamically loading other applications.
2. **The Remote:** This is a domain-specific application (e.g., an Inventory or User Profile module). It exposes specific parts of itself (Components, Modules, Routes) that the Host can consume.

**The Example Scenario**

In this guide, we will build a system with:

* **Host**: A "Shell" application running on port 4200.
* **Remote**: A "Shop" application running on port 4201.

## 3. Prerequisites

* **Angular CLI**: Version 17+ (Standalone components recommended)
* **Node.js**: Version 18+
* **Library**: `@angular-architects/module-federation` (The industry standard for Angular).

## 4. Implementation Guide

### Step 1: Project Scaffolding

Start by generating two separate Angular applications. It is best practice to keep them in separate folders or a monorepo (like Nx), but for simplicity, we will generate them as standard CLI projects.

```shell
# 1. Create the Host (The Shell)
ng new shell-app --standalone --style=css --routing=true

# 2. Create the Remote (The Feature App)
ng new remote-app --standalone --style=css --routing=true
```

### Step 2: Enabling Module Federation

We use the `@angular-architects/module-federation` schematic to automatically configure Webpack. This creates a `webpack.config.js` file in your project root, which allows you to customize the build process.

```shell
# Configure the Shell as a "host"
cd shell-app
ng add @angular-architects/module-federation --project shell-app --port 4200 --type host

# Configure the Remote as a "remote"
cd ../remote-app
ng add @angular-architects/module-federation --project remote-app --port 4201 --type remote
```

### Step 3: Configuring the Remote

The "Remote" needs to decide what to share with the world. We typically share the **Routes** configuration so the Host can lazy-load the entire module at once.

File: `remote-app/webpack.config.js`

```typescript
const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  name: 'remote_app', // Unique internal name

  // EXPOSES: What parts of this app can others use?
  exposes: {
    // We expose the routes file under the alias './Routes'
    './Routes': './src/app/app.routes.ts',
  },

  // SHARED: Prevent loading duplicate libraries (Angular, RxJS, etc.)
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
});
```

### Step 4: Configuring the Host

The "Host" needs to know where to find the Remote applications. We map a virtual name to a physical URL.

File: `shell-app/webpack.config.js`

```typescript
const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  // REMOTES: Where are the other apps located?
  remotes: {
    // "mfe1" is the variable name we will use in imports
    // "remote_app" matches the 'name' property in the Remote's config
    "mfe1": "http://localhost:4201/remoteEntry.js",
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
});
```

### Step 5: Lazy Loading the Remote

In the Host's routing configuration, we use standard Angular lazy loading. However, instead of a file path, we import the Virtual Module defined in the Webpack config.

File: `shell-app/src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'shop',
    // 'mfe1' matches the key in the Host's webpack.config.js
    // './Routes' matches the key in the Remote's 'exposes' config
    loadChildren: () => import('mfe1/Routes').then(m => m.routes)
  }
];
```

*Tip: TypeScript will complain that 'mfe1/Routes' doesn't exist. Create a decl.d.ts file in your src folder:*

```typescript
declare module 'mfe1/Routes';
```

## 5. Handling Communication & State

A common challenge in Micro-Frontends is sharing data (like Authentication Tokens) between apps that run in isolation. Since Angular creates separate Dependency Injection trees for the Host and Remote, services are often not singletons across boundaries.

### Strategy 1: Browser Storage (Best for Auth)

Use `localStorage` or `sessionStorage` as the single source of truth.

1. **Host**: User logs in. Host saves token to `localStorage`.
2. **Remote**: When performing API calls, the Remote reads the token directly from `localStorage`.

### Strategy 2: Custom Events (Best for Actions)

Use standard DOM events to trigger updates across the window.

**Host (Sender):**

```typescript
// Notify all micro-frontends that an order occurred
window.dispatchEvent(new CustomEvent('order-update', { detail: { id: 123 } }));
```

**Remote (Listener):**

```typescript
ngOnInit() {
  window.addEventListener('order-update', (event) => {
    console.log('Refreshing inventory...');
    this.refreshData();
  });
}
```

### Strategy 3: Shared Library (Advanced)

For complex state (like a Redux store), you can create a third project (a Library) containing the state logic. Publish this library to NPM (or map it via `tsconfig` paths) and add it to the `shared` array in `webpack.config.js` for both apps. This forces Webpack to share the *exact same instance* of the library.

## 6. Deployment Considerations

When moving to production, `localhost` URLs won't work.

1. **Dynamic Remotes:** Do not hardcode URLs in `webpack.config.js`. Instead, load a `manifest.json` file at runtime that maps remote names to their production URLs.
2. **CORS**: Your Remote applications (e.g., `shop.example.com`) must enable CORS headers (`Access-Control-Allow-Origin: *`) so the Host (`app.example.com`) can download their JavaScript bundles.
3. **Versioning**: Ensure your Host and Remotes share compatible versions of Angular to prevent runtime errors.

## 7. Conclusion

By implementing Module Federation, you achieve:

* **Independent Deployment**: Update the Shop without redeploying the Shell.
* **Scalability**: Separate teams can work on different domains simultaneously.
* **Performance**: Code is downloaded only when the user navigates to that specific route.

## 8. References & Resources

* [Dynamic Module Federation with Angular (Nx Guide)](https://nx.dev/docs/technologies/angular/guides/dynamic-module-federation-with-angular)
* [Module Federation Practice (Community Guide)](https://module-federation.io/practice/frameworks/angular/angular-mfe)
