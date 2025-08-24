import { Routes } from '@angular/router';
import { ListComponent } from './pages/list/list.component';
import { GameMultiplayerComponent } from './pages/game-multiplayer/game-multiplayer.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { ArenaComponent } from './pages/arena/arena.component';

export const routes: Routes = [
    { path: "", redirectTo: "arena", pathMatch: "full" },
    { path: "arena", component: ArenaComponent },
    { path: "multiplayer", component: ListComponent },
    { path: "multiplayer/:id", component: GameMultiplayerComponent },
    { path: "not-found", component: NotFoundComponent  },
    { path: "**", redirectTo: "not-found", pathMatch: "full" }
];
