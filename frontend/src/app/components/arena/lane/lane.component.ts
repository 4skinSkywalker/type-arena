import { Component, input } from '@angular/core';

@Component({
  selector: 'app-lane',
  imports: [],
  templateUrl: './lane.component.html',
  styleUrl: './lane.component.scss'
})
export class LaneComponent {
  finished = input(false, { alias: "finished"});
  position = input(0, { alias: "position"});
  percentage = input(0, { alias: "percentage"});
  car = input(1, { alias: "car"});
  username = input("Anonymous", { alias: "username"});
}
