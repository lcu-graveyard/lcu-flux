import { Component, EventEmitter, forwardRef, Inject, Input, Provider, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CronTypes, CronFrequency, CronOptions, CronTimerService, BaseFrequency } from '../svc/cronTimerSvc';

const CUSTOM_VALUE_ACCESSOR: any = {
	provide: NG_VALUE_ACCESSOR,
	useExisting: forwardRef(() => CronTimerComponent),
	multi: true
};

@Component({
	selector: 'cron-timer',
	templateUrl: './cron-timer.html',
	providers: [CUSTOM_VALUE_ACCESSOR],
	host: {
		'[attr.multiple]': 'Multiple'
	}
})
export class CronTimerComponent implements ControlValueAccessor, OnInit {
	//	Fields
	protected modelChanged: boolean;

	protected months = {
		1: "January",
		2: "February",
		3: "March",
		4: "April",
		5: "May",
		6: "June",
		7: "July",
		8: "August",
		9: "September",
		10: "October",
		11: "November",
		12: "December"
	};

	protected onChange = (_) => { };

	protected onTouched = () => { };

	//	Properties
	@Output()
	public Changed: EventEmitter<any>;

	@Input('type')
	public CronType: CronTypes;

	public DayOfMonthValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];

	public DayValues = [0, 1, 2, 3, 4, 5, 6];

	public FrequencyConfig = [
		{
			Value: "1",
			Label: "Minute"
		}, {
			Value: "2",
			Label: "Hour"
		}, {
			Value: "3",
			Label: "Day"
		}, {
			Value: "4",
			Label: "Week"
		}, {
			Value: "5",
			Label: "Month"
		}, {
			Value: "6",
			Label: "Year"
		}
	];

	public HourValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

	public MinuteValues = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

	public MonthValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

	public Frequency: CronFrequency;

	@Input('multiple')
	public Multiple: boolean;

	@Input('options')
	public Options: CronOptions;

	//	Constructors
	constructor(protected cronSvc: CronTimerService) {
		this.CronType = CronTypes.Default;

		this.Frequency = <CronFrequency>{};

		this.Options = {
			AllowMinute: true,
			AllowHour: true,
			AllowDay: true,
			AllowWeek: true,
			AllowMonth: true,
			AllowYear: true
		};
	}

	//	Runtime
	public ngOnInit() {
		if (this.CronType == CronTypes.Quartz) {
			this.DayValues = [1, 2, 3, 4, 5, 6, 7];
		}

		var optionsKeyArray = Object.keys(this.Options);

		for (var i in optionsKeyArray) {
			var currentKey = optionsKeyArray[i].replace(/^allow/, "");

			var originalKey = optionsKeyArray[i];

			if (!this.Options[originalKey]) {
				this.FrequencyConfig.splice(this.FrequencyConfig.findIndex(f => f.Label === currentKey), 1);
			}
		}

		//$scope.$watch("myFrequency", function (n, o) {
		//	if (n !== undefined) {
		//		if (n && n.base && (!o || n.base !== o.base) && !this.modelChanged) {
		//			this.setInitialValuesForBase(n);
		//		} else if (n && n.base && o && o.base) {
		//			this.modelChanged = false;
		//		}

		//		var newVal = this.cronSvc.setCron(n, this.CronType);
		//		$ngModel.$setViewValue(newVal);
		//	}
		//}, true);
	}

	//	API Methods
	public CronDayName(input: number) {
		var days;
		if (this.CronType == CronTypes.Quartz) {
			days = {
				1: "Sunday",
				2: "Monday",
				3: "Tuesday",
				4: "Wednesday",
				5: "Thursday",
				6: "Friday",
				7: "Saturday",
			};
		} else {
			days = {
				0: "Sunday",
				1: "Monday",
				2: "Tuesday",
				3: "Wednesday",
				4: "Thursday",
				5: "Friday",
				6: "Saturday",
			};
		}


		if (input !== null && days[input]) {
			return days[input];
		} else {
			return null;
		}
	}

	public CronMonthName(input: number) {
		if (input !== null && this.months[input]) {
			return this.months[input];
		} else {
			return null;
		}
	}

	public CronNumeral(input: number) {
		switch (input) {
			case 1:
				return "1st";
			case 2:
				return "2nd";
			case 3:
				return "3rd";
			case 21:
				return "21st";
			case 22:
				return "22nd";
			case 23:
				return "23rd";
			case 31:
				return "31st";
			case null:
				return null;
			default:
				return input + "th";
		}
	}

	public HandleChange(freq: CronFrequency, prop: string, value: any) {
		freq[prop] = value;

		if (freq && freq.Base && (!this.Frequency || freq.Base !== this.Frequency.Base) && !this.modelChanged) {
			this.setInitialValuesForBase(freq);
		} else if (freq && freq.Base && this.Frequency && this.Frequency.Base) {
			this.modelChanged = false;
		}

		var newVal = this.cronSvc.SetCron(freq, this.CronType);

		this.onChange(newVal);
	}

	public registerOnChange(fn: (_: any) => void): void {
		this.onChange = fn;
	}

	public registerOnTouched(fn: () => void): void {
		this.onTouched = fn;
	}

	public SetFrequency(newValue: any) {
		if (newValue) {
			this.modelChanged = true;

			this.Frequency = this.cronSvc.FromCron(newValue, this.Multiple, this.CronType);
		} else if (newValue === "") {
			this.Frequency = undefined;
		}
	}

	public writeValue(value: any): void {
		this.SetFrequency(value);
	}

	//	Helpers
	protected setInitialValuesForBase(freq: CronFrequency) {
		freq.Base = parseInt(freq.Base);

		if (freq.Base >= BaseFrequency.hour) {
			freq.MinuteValues = this.MinuteValues[0];
		}

		if (freq.Base >= BaseFrequency.day) {
			freq.HourValues = this.HourValues[0];
		}

		if (freq.Base === BaseFrequency.week) {
			freq.DayValues = this.DayValues[0];
		}

		if (freq.Base >= BaseFrequency.month) {
			freq.DayOfMonthValues = this.DayOfMonthValues[0];
		}

		if (freq.Base === BaseFrequency.year) {
			freq.MonthValues = this.MonthValues[0];
		}
	}
}