export class Sidebar {
  private container: HTMLElement;

  constructor(containerId: string) {
    const el = document.querySelector(containerId) as HTMLElement;
    if (!el) throw new Error(`Container ${containerId} not found`);
    this.container = el;
  }

  render() {
    this.container.innerHTML = `
      <aside class="main-sidebar sidebar-dark-primary elevation-4">

        <!-- Brand -->
        <a href="#" class="brand-link">
          <span class="brand-text font-weight-light">
            PCFS UniSBOM Dashboard
          </span>
        </a>

        <!-- Sidebar -->
        <div class="sidebar">

          <!-- Menu -->
          <nav class="mt-2">
            <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview">

              <li class="nav-item">
                <a href="#" class="nav-link active" id="menu-flow">
                  <i class="nav-icon fas fa-project-diagram"></i>
                  <p>Flow Matrix</p>
                </a>
              </li>

              <li class="nav-item">
                <a href="#" class="nav-link" id="menu-sunburst">
                  <i class="nav-icon fas fa-chart-pie"></i>
                  <p>Sunburst</p>
                </a>
              </li>

              <li class="nav-item">
                <a href="#" class="nav-link" id="menu-coverage">
                  <i class="nav-icon fas fa-cogs"></i>
                  <p>Coverage CheckList</p>
                </a>
              </li>

            </ul>
          </nav>

        </div>
      </aside>
    `;
  }

  // Optional: attach events
  bindEvents() {
    document.getElementById("menu-flow")?.addEventListener("click", () => {
      console.log("Flow Matrix clicked");
    });

    document.getElementById("menu-sunburst")?.addEventListener("click", () => {
      console.log("Sunburst clicked");
    });

    document.getElementById("menu-coverage")?.addEventListener("click", () => {
      console.log("Coverage clicked");
    });
  }
}
