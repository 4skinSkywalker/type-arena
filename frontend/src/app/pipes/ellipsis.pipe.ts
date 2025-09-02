import { Pipe, PipeTransform } from '@angular/core';

export function ellipsis(value: string, limit: number) {
  if (!value) return '';
  if (value.length <= limit) return value;

  return value.substring(0, limit) + '...';
}

@Pipe({
  name: 'ellipsis'
})
export class EllipsisPipe implements PipeTransform {

  transform(value: string, limit: number): string {
    return ellipsis(value, limit);
  }

}
