import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-lane',
  imports: [],
  templateUrl: './lane.component.html',
  styleUrl: './lane.component.scss'
})
export class LaneComponent {
  @Input("finished") finished = false;
  @Input("position") position = 0;
  @Input("percentage") percentage = 0;
  @Input("car") car = 1;
}
