import { Routes } from '@angular/router';
import { RoomsComponent } from './pages/rooms/rooms.component';
import { RoomComponent } from './pages/room/room.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

export const routes: Routes = [
    { path: "", redirectTo: "multiplayer", pathMatch: "full" },
    { path: "multiplayer", component: RoomsComponent },
    { path: "multiplayer/:id", component: RoomComponent },
    { path: "not-found", component: NotFoundComponent  },
    { path: "**", redirectTo: "not-found", pathMatch: "full" }
];
