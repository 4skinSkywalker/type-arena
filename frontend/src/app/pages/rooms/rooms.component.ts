import { Component } from '@angular/core';
import { BasicModule } from '../../basic.module';
import { ApiService, Handlers } from '../../services/api.service';
import { map, startWith, switchMap } from 'rxjs';
import { FormControl } from '@angular/forms';
import { check, latinize, uncheck } from '../../shared/utils';
import { LoaderService } from '../../components/loader/loader-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rooms',
  imports: [BasicModule],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.scss'
})
export class RoomsComponent {
  check = check;
  uncheck = uncheck;
  rooms$;
  filterByName = new FormControl("", { nonNullable: true });
  roomName = new FormControl("", { nonNullable: true });
  deathMode = new FormControl(false, { nonNullable: true });
  language = new FormControl("en", { nonNullable: true });

  handlers: Handlers = {};

  constructor(
    public api: ApiService,
    private loaderService: LoaderService,
    private router: Router
  ) {
    this.rooms$ = this.filterByName.valueChanges
      .pipe(
        startWith(""),
        switchMap((value: string) => {
          return this.api.rooms$.pipe(
            map(rooms =>
              rooms.filter(room => room.name.toUpperCase().includes(value.toUpperCase()))
            )
          );
        })
      );
    
    this.api.send("listRooms");
  }

  openCreateRoomModal() {
    check('#create-room-modal-trigger');

    const input = document.querySelector(".create-room-modal .form-control") as HTMLInputElement;
    input.value = "";
    setTimeout(() => input.focus(), 100);
    
    const keydownHandler = (evt: any) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        this.roomNameModalOk();
        input.removeEventListener("keydown", keydownHandler);
      }
    };
    input.addEventListener("keydown", keydownHandler);
  }

  roomNameModalOk() {
    const roomName = latinize(this.roomName.value);
    if (!roomName) {
      return console.error("Room name is empty");
    }

    const createRoom = {
      name: roomName,
      deathMode: this.deathMode.value,
      language: this.language.value
    };
    uncheck("#create-room-modal-trigger");

    this.api.one("roomCreated", async ({ room }) => {
      await this.router.navigate(["/multiplayer", room.id]);
      this.loaderService.isLoading.set(false);
    });

    this.api.send("createRoom", createRoom);
    this.loaderService.isLoading.set(true);
  }
}
