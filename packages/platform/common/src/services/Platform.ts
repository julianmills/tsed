import {ControllerProvider, Injectable, InjectorService, ProviderScope, TokenProvider} from "@tsed/di";
import {PlatformRouters} from "@tsed/platform-router";
import {Route, RouteController} from "../interfaces/Route";
import {PlatformApplication} from "./PlatformApplication";
import {PlatformHandler} from "./PlatformHandler";

/**
 * `Platform` is used to provide all routes collected by annotation `@Controller`.
 *
 * @platform
 */
@Injectable({
  scope: ProviderScope.SINGLETON,
  imports: [PlatformHandler]
})
export class Platform {
  #controllers: Map<string, RouteController> = new Map();

  constructor(
    readonly injector: InjectorService,
    readonly platformApplication: PlatformApplication,
    readonly platformRouters: PlatformRouters
  ) {
    platformRouters.prebuild();
  }

  get app() {
    return this.platformApplication;
  }

  public addRoutes(routes: Route[]) {
    routes.forEach((routeSettings) => {
      this.addRoute(routeSettings.route, routeSettings.token);
    });
  }

  public addRoute(route: string, token: TokenProvider) {
    const provider = this.injector.getProvider(token) as ControllerProvider;

    if (!provider || provider.hasParent()) {
      return this;
    }

    const router = this.platformRouters.from(provider.token);

    this.app.use(route, router);

    return this;
  }

  public getLayers() {
    this.#controllers = new Map();

    return this.platformRouters.getLayers(this.app).map((layer) => {
      if (layer.isProvider()) {
        this.#controllers.set(layer.provider.token, {
          route: String(layer.path).split(layer.provider.path)[0],
          provider: layer.provider
        });
      }

      return layer;
    });
  }

  /**
   * Get all controllers mounted on the application.
   * @returns  {RouteController[]}
   */
  public getMountedControllers(): RouteController[] {
    return [...this.#controllers.values()];
  }
}
