define([
	'js/rendering/lightningBuilder',
	'js/rendering/effects'
], function(
	lightningBuilder,
	effects
) {
	return {
		type: 'lightningEffect',

		cd: 0,
		cdMax: 1,

		effect: null,

		ttl: 6,
		lineGrow: false,
		linePercentage: 0.1,

		lineShrink: false,
		shrinking: false,

		init: function() {
			effects.register(this);

			var xOffset = (this.toX >= this.obj.x) ? 1 : 0;

			var fromX = this.obj.x + xOffset;
			var fromY = this.obj.y + 0.5;

			var toX = this.lineGrow ? fromX : this.toX + 0.5;
			var toY = this.lineGrow ? fromY : this.toY + 0.5;

			this.effect = lightningBuilder.build({
				fromX: fromX,
				fromY: fromY,
				toX: toX,
				toY: toY,
				divisions: this.divisions,
				colors: this.colors,
				maxDeviate: this.maxDeviate
			});
		},

		renderManual: function() {
			var cdMax = this.cdMax;
			if (((this.lineGrow) && (this.linePercentage < 1)) || ((this.shrinking) && (this.linePercentage > 0)))
				cdMax = 1;

			if (this.cd > 0) {
				this.cd--;
				return;
			}

			this.cd = cdMax;

			lightningBuilder.destroy(this.effect);
			this.effect = null;

			if (!this.shrinking) {
				this.ttl--;
				if (this.ttl == 0) {
					this.destroyed = true;
					return;
				}
			}

			var xOffset = (this.toX >= this.obj.x) ? 1 : 0;

			var fromX = this.obj.x + xOffset;
			var fromY = this.obj.y + 0.5;

			var toX = this.toX + 0.5;
			var toY = this.toY + 0.5;

			var changeTo = (
				(
					(this.lineGrow) && 
					(this.linePercentage < 1)
				) ||
				(
					(this.shrinking) &&
					(this.linePercentage > 0)
				)
			);

			if (changeTo) {
				var linePercentage = this.linePercentage;
				if (this.shrinking) {
					linePercentage /= 1.5;
				} else {
					linePercentage *= 1.5;
					if (linePercentage > 1)
						linePercentage = 1;
				}
				this.linePercentage = linePercentage;

				var angle = Math.atan2(toY - fromY, toX - fromX);
				var distance = Math.sqrt(Math.pow(fromX - toX, 2) + Math.pow(fromY - toY, 2));
				toX = fromX + (Math.cos(angle) * distance * this.linePercentage);
				toY = fromY + (Math.sin(angle) * distance * this.linePercentage);
			}

			this.effect = lightningBuilder.build({
				fromX: fromX,
				fromY: fromY,
				toX: toX,
				toY: toY,
				divisions: this.divisions,
				colors: this.colors,
				maxDeviate: this.maxDeviate
			});

			if ((this.shrinking) && (linePercentage < 0.1))
				this.destroyed = true;
		},

		destroyManual: function() {
			if ((!this.lineShrink) || (this.shrinking)) {
				if (this.effect)
					lightningBuilder.destroy(this.effect);

				//effects.unregister(this);
				return;
			}

			this.destroyed = false;
			this.shrinking = true;

			return true;
		}
	};
});