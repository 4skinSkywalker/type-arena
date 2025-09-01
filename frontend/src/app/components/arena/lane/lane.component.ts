import { Component, input } from '@angular/core';
import { IWinners } from '../../../../../../backend/src/models';
import { getDefaultWinners } from '../../../pages/room/room.util';
import { BasicModule } from '../../../basic.module';

@Component({
  selector: 'app-lane',
  imports: [BasicModule],
  templateUrl: './lane.component.html',
  styleUrl: './lane.component.scss'
})
export class LaneComponent {
  winners = input<IWinners>(getDefaultWinners(), { alias: "winners" });
  id = input("", { alias: "id" });
  finished = input(false, { alias: "finished" });
  position = input(0, { alias: "position" });
  percentage = input(0, { alias: "percentage" });
  car = input(1, { alias: "car"});
  username = input("Anonymous", { alias: "username" });
  deathMode = input(false, { alias: "deathMode" });
  dead = input(false, { alias: "dead" });
  deadPercentage = input<number | undefined>(undefined, { alias: "deadPercentage" });
}
