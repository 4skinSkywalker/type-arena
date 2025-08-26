import { Routes } from '@angular/router';
import { ListComponent } from './pages/list/list.component';
import { GameMultiplayerComponent } from './pages/game-multiplayer/game-multiplayer.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

export const routes: Routes = [
    { path: "", redirectTo: "multiplayer", pathMatch: "full" },
    { path: "multiplayer", component: ListComponent },
    { path: "multiplayer/:id", component: GameMultiplayerComponent },
    { path: "not-found", component: NotFoundComponent  },
    { path: "**", redirectTo: "not-found", pathMatch: "full" }
];
