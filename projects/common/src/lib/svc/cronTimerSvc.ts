import { Inject, Injectable } from '@angular/core';

export enum CronTypes {
	Default,
	Quartz
}

export class CronFrequency {
	public Base: any;

	public DayValues: any;

	public DayOfMonthValues: any;

	public HourValues: any;

	public MinuteValues: any;

	public MonthValues: any;
}

export class CronOptions {
	public AllowMinute: boolean;

	public AllowHour: boolean;

	public AllowDay: boolean;

	public AllowWeek: boolean;

	public AllowMonth: boolean;

	public AllowYear: boolean;
}

export var BaseFrequency: {
	minute: number,
	hour: number,
	day: number,
	week: number,
	month: number,
	year: number
} = {
		minute: 1,
		hour: 2,
		day: 3,
		week: 4,
		month: 5,
		year: 6
	};

@Injectable({
	providedIn: 'root'
})
export class CronTimerService {
	//	Fields

	//	Constructors
	constructor() {
	}

	//	API Methods
	public FromCron(value, allowMultiple: boolean, cronType: CronTypes) {
		if (cronType == CronTypes.Quartz) {
			return this.fromQuartzCron(value, allowMultiple);
		} else {
			return this.fromDefaultCron(value, allowMultiple);
		}
	}

	public SetCron(n, cronType: CronTypes) {
		if (cronType == CronTypes.Quartz) {
			return this.setQuartzCron(n);
		} else {
			return this.setDefaultCron(n);
		}
	}

	//	Helpers
	protected fromDefaultCron(value: string, allowMultiple: boolean) {
		var cron = value.replace(/\s+/g, " ").split(" ");

		var frequency = <CronFrequency>{
			Base: "1",
			MinuteValues: null,
			HourValues: null,
			DayOfMonthValues: null,
			MonthValues: null,
			DayValues: null
		};

		var tempArray = [];

		if (cron[0] === "*" && cron[1] === "*" && cron[2] === "*" && cron[3] === "*" && cron[4] === "*") {
			frequency.Base = BaseFrequency.minute; // every minute
		} else if (cron[1] === "*" && cron[2] === "*" && cron[3] === "*" && cron[4] === "*") {
			frequency.Base = BaseFrequency.hour; // every hour
		} else if (cron[2] === "*" && cron[3] === "*" && cron[4] === "*") {
			frequency.Base = BaseFrequency.day; // every day
		} else if (cron[2] === "*" && cron[3] === "*") {
			frequency.Base = BaseFrequency.week; // every week
		} else if (cron[3] === "*" && cron[4] === "*") {
			frequency.Base = BaseFrequency.month; // every month
		} else if (cron[4] === "*") {
			frequency.Base = BaseFrequency.year; // every year
		}

		if (cron[0] !== "*") {
			//preparing to handle multiple minutes
			if (allowMultiple) {
				tempArray = cron[0].split(',');
				for (var i = 0; i < tempArray.length; i++) { tempArray[i] = +tempArray[i]; }
				frequency.MinuteValues = tempArray;
			} else {
				frequency.MinuteValues = parseInt(cron[0]);
			}
		}

		if (cron[1] !== "*") {
			//preparing to handle multiple hours
			if (allowMultiple) {
				tempArray = cron[1].split(",");
				for (var i = 0; i < tempArray.length; i++) { tempArray[i] = +tempArray[i]; }
				frequency.HourValues = tempArray;
			} else {
				frequency.HourValues = parseInt(cron[1]);
			}
		}

		if (cron[2] !== "*") {
			//preparing to handle multiple days of the month
			if (allowMultiple) {
				tempArray = cron[2].split(",");
				for (var i = 0; i < tempArray.length; i++) { tempArray[i] = +tempArray[i]; }
				frequency.DayOfMonthValues = tempArray;
			} else {
				frequency.DayOfMonthValues = parseInt(cron[2]);
			}
		}

		if (cron[3] !== "*") {
			//preparing to handle multiple months
			if (allowMultiple) {
				tempArray = cron[3].split(",");
				for (var i = 0; i < tempArray.length; i++) { tempArray[i] = +tempArray[i]; }
				frequency.MonthValues = tempArray;
			} else {
				frequency.MonthValues = parseInt(cron[3]);
			}
		}

		if (cron[4] !== "*") {
			//preparing to handle multiple days of the week
			if (allowMultiple) {
				tempArray = cron[4].split(",");
				for (var i = 0; i < tempArray.length; i++) { tempArray[i] = +tempArray[i]; }
				frequency.DayValues = tempArray;
			} else {
				frequency.DayValues = parseInt(cron[4]);
			}
		}

		return frequency;
	}

	protected fromQuartzCron(value: string, allowMultiple: boolean) {
		var cron = value.replace(/\s+/g, " ").split(" ");

		var frequency = <CronFrequency>{
			Base: "1",
			MinuteValues: null,
			HourValues: null,
			DayOfMonthValues: null,
			MonthValues: null,
			DayValues: null
		};
		var tempArray = [];

		if (cron[1] === "*" && cron[2] === "*" && cron[3] === "*" && cron[4] === "*" && cron[5] === "?") {
			frequency.Base = 1; // every minute
		} else if (cron[2] === "*" && cron[3] === "*" && cron[4] === "*" && cron[5] === "?") {
			frequency.Base = 2; // every hour
		} else if (cron[3] === "*" && cron[4] === "*" && cron[5] === "?") {
			frequency.Base = 3; // every day
		} else if (cron[3] === "?") {
			frequency.Base = 4; // every week
		} else if (cron[4] === "*" && cron[5] === "?") {
			frequency.Base = 5; // every month
		} else if (cron[5] === "?") {
			frequency.Base = 6; // every year
		}

		if (cron[1] !== "*") {
			//preparing to handle multiple minutes
			if (allowMultiple) {
				tempArray = cron[1].split(",");
				for (var i = 0; i < tempArray.length; i++) { tempArray[i] = +tempArray[i]; }
				frequency.MinuteValues = tempArray;
			} else {
				frequency.MinuteValues = parseInt(cron[1]);
			}
		}

		if (cron[2] !== "*") {
			//preparing to handle multiple hours
			if (allowMultiple) {
				tempArray = cron[2].split(",");
				for (var i = 0; i < tempArray.length; i++) { tempArray[i] = +tempArray[i]; }
				frequency.HourValues = tempArray;
			} else {
				frequency.HourValues = parseInt(cron[2]);
			}
		}

		if (cron[3] !== "*" && cron[3] !== "?") {
			//preparing to handle multiple days of the month
			if (allowMultiple) {
				tempArray = cron[3].split(",");
				for (var i = 0; i < tempArray.length; i++) { tempArray[i] = +tempArray[i]; }
				frequency.DayOfMonthValues = tempArray;
			} else {
				frequency.DayOfMonthValues = parseInt(cron[3]);
			}
		}

		if (cron[4] !== "*") {
			//preparing to handle multiple months
			if (allowMultiple) {
				tempArray = cron[4].split(",");
				for (var i = 0; i < tempArray.length; i++) { tempArray[i] = +tempArray[i]; }
				frequency.MonthValues = tempArray;
			} else {
				frequency.MonthValues = parseInt(cron[4]);
			}
		}

		if (cron[5] !== "*" && cron[5] !== "?") {
			//preparing to handle multiple days of the week
			if (allowMultiple) {
				tempArray = cron[5].split(",");
				for (var i = 0; i < tempArray.length; i++) { tempArray[i] = +tempArray[i]; }
				frequency.DayValues = tempArray;
			} else {
				frequency.DayValues = parseInt(cron[5]);
			}
		}

		return frequency;
	}

	protected setDefaultCron(n: CronFrequency) {
		var cron = ["*", "*", "*", "*", "*"];

		if (n && n.Base && n.Base >= BaseFrequency.hour) {
			cron[0] = typeof n.MinuteValues ? n.MinuteValues : "*";
		}

		if (n && n.Base && n.Base >= BaseFrequency.day) {
			cron[1] = typeof n.HourValues ? n.HourValues : "*";
		}

		if (n && n.Base && n.Base === BaseFrequency.week) {
			cron[4] = n.DayValues;
		}

		if (n && n.Base && n.Base >= BaseFrequency.month) {
			cron[2] = typeof n.DayOfMonthValues ? n.DayOfMonthValues : "*";
		}

		if (n && n.Base && n.Base === BaseFrequency.year) {
			cron[3] = typeof n.MonthValues ? n.MonthValues : "*";
		}

		return cron.join(" ");
	}

	protected setQuartzCron(n: CronFrequency) {
		var cron = ["0", "*", "*", "*", "*", "?"];

		if (n && n.Base && n.Base >= BaseFrequency.hour) {
			cron[1] = typeof n.MinuteValues ? n.MinuteValues : "0";
		}

		if (n && n.Base && n.Base >= BaseFrequency.day) {
			cron[2] = typeof n.HourValues ? n.HourValues : "*";
		}

		if (n && n.Base && n.Base === BaseFrequency.week) {
			cron[3] = "?";
			cron[5] = n.DayValues;
		}

		if (n && n.Base && n.Base >= BaseFrequency.month) {
			cron[3] = typeof n.DayOfMonthValues ? n.DayOfMonthValues : "?";
		}

		if (n && n.Base && n.Base === BaseFrequency.year) {
			cron[4] = typeof n.MonthValues ? n.MonthValues : "*";
		}

		return cron.join(" ");
	}
}