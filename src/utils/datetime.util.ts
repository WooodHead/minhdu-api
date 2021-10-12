import * as moment from "moment";

export function firstDatetimeOfMonth(datetime: string | Date | undefined): Date | undefined {
  return datetime ? moment(datetime).clone().startOf('months').toDate() : undefined;
}

export function lastDatetimeOfMonth(datetime: string | Date | undefined): Date | undefined {
  return datetime ? moment(datetime).clone().endOf('months').toDate() : undefined;
}

// Ngày cuối cùng của tháng. Nếu tháng hiện tại thì ngày cuối cùng của tháng là hôm nay
export function lastDayOfMonth(datetime: Date): number {
  return moment(datetime).endOf('month').date();
}

export function tomorrowDate() {
  return moment(new Date).add(1, 'day').toDate();
}
