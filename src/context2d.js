import { RoughHachureIterator } from './geom/hachure-iterator';
import { RoughSegmentRelation, RoughSegment } from './geom/segment';

export class RoughContext {
  constructor(context) {
    this.ctx = context;

    this.fillWeight = -1;
    this.roughFillStyle = "hachure";
    this.maxRandomnessOffset = 2;
    this.roughness = 1;
    this.bowing = 1;
    this.hachureAngle = -41;
    this.hachureGap = -1;
    this._currentPath = [];
    this._currentPathClosed = true;

    // Mirror properties
    const ctxProps = ['fillStyle', 'lineWidth', 'lineCap', 'lineJoin', 'miterLimit', 'strokeStyle', 'lineDashOffset',
      'font', 'textAlign', 'textBaseline', 'direction', 'shadowBlur', 'shadowColor', 'shadowOffsetX', 'shadowOffsetY',
      'currentTransform'];
    for (let i = 0; i < ctxProps.length; i++) {
      this._defineRenderProperty(ctxProps[i]);
    }

    // Mirror methods
    const ctxMethods = ['clearRect', 'fillText', 'strokeText', 'measureText', 'getLineDash', 'setLineDash',
      'createLinearGradient', 'createRadialGradient', 'createPattern', 'rotate', 'scale'];
    for (let i = 0; i < ctxMethods.length; i++) {
      this[ctxMethods[i]] = this.ctx[ctxMethods[i]];
    }
  }

  // Properties

  _defineRenderProperty(name) {
    Object.defineProperty(this, name, {
      get: function () {
        return this.ctx[name];
      },
      set: function (value) {
        this.ctx[name] = value;
      }
    });
  }

  // Drawing a rectangle

  fillRect(x, y, width, height) {
    const left = x;
    const right = x + width;
    const top = y;
    const bottom = y + height;
    const xc = [left, right, right, left];
    const yc = [top, top, bottom, bottom];
    this._hachureFillShape(xc, yc);
  }

  strokeRect(x, y, width, height) {
    const left = x;
    const right = x + width;
    const top = y;
    const bottom = y + height;
    this._drawLine(left, top, right, top);
    this._drawLine(right, top, right, bottom);
    this._drawLine(right, bottom, left, bottom);
    this._drawLine(left, bottom, left, top);
  }

  // Path

  beginPath() {
    this._currentPath = [];
    this._currentPathClosed = false;
  }

  moveTo(x, y) {
    this._currentPath.push({
      command: 'm',
      data: [x, y],
      cursor: [x, y]
    });
  }

  lineTo(x, y) {
    this._currentPath.push({
      command: 'l',
      data: [x, y],
      cursor: [x, y]
    });
  }

  bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
    this._currentPath.push({
      command: 'b',
      data: [cp1x, cp1y, cp2x, cp2y, x, y],
      cursor: [x, y]
    });
  }

  quadraticCurveTo(cpx, cpy, x, y) {
    this._currentPath.push({
      command: 'q',
      data: [cpx, cpy, x, y],
      cursor: [x, y]
    });
  }

  arc(x, y, radius, startAngle, endAngle, anticlockwise) {
    this._currentPath.push({
      command: 'a',
      data: [x, y, radius, startAngle, endAngle, anticlockwise],
      cursor: [x, y]
    });
    // TODO: update cursor
  }

  arcTo(x1, y1, x2, y2, radius) {
    this._currentPath.push({
      command: 'at',
      data: [x1, y1, x2, y2, radius],
      cursor: [x2, y2]
    });
    // TODO: update cursor
  }

  rect(x, y, width, height) {
    // TODO: 
  }

  ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
    // TODO: 
  }

  closePath() {
    if (!this._currentPathClosed) {
      if (this._currentPath.length > 1) {
        var p1 = this._currentPath[0].cursor;
        var p2 = this._currentPath[this._currentPath.length - 1].cursor;
        if ((Math.round(p1[0]) != Math.round(p2[0])) || (Math.round(p1[1]) != Math.round(p2[1]))) {
          this.lineTo(p1[0], p2[0]);
        }
      }
    }
    this._currentPathClosed = true;
  }

  // Unsuported methods

  drawFocusIfNeeded() {
    console.error("RoughContext2d does not support the method: drawFocusIfNeeded");
  }

  // Internal methods

  _getOffset(min, max) {
    return this.roughness * ((Math.random() * (max - min)) + min);
  }

  _drawLine(x1, y1, x2, y2) {
    let lengthSq = Math.pow((x1 - x2), 2) + Math.pow((x1 - x2), 2);
    let offset = this.maxRandomnessOffset || 0;
    if (offset * offset * 100 > lengthSq) {
      offset = Math.sqrt(lengthSq) / 10;
    }
    let halfOffset = offset / 2;
    let divergePoint = 0.2 + Math.random() * 0.2;
    // Midpoint displacement value to give slightly bowed lines.
    let midDispX = this.bowing * this.maxRandomnessOffset * (y2 - y1) / 200;
    let midDispY = this.bowing * this.maxRandomnessOffset * (x1 - x2) / 200;
    midDispX = this._getOffset(-midDispX, midDispX);
    midDispY = this._getOffset(-midDispY, midDispY);
    var ctx = this.ctx;
    ctx.moveTo(x1 + this._getOffset(-offset, offset), y1 + this._getOffset(-offset, offset));
    ctx.bezierCurveTo(midDispX + x1 + (x2 - x1) * divergePoint + this._getOffset(-offset, offset),
      midDispY + y1 + (y2 - y1) * divergePoint + this._getOffset(-offset, offset),
      midDispX + x1 + 2 * (x2 - x1) * divergePoint + this._getOffset(-offset, offset),
      midDispY + y1 + 2 * (y2 - y1) * divergePoint + this._getOffset(-offset, offset),
      x2 + this._getOffset(-offset, offset),
      y2 + this._getOffset(-offset, offset));
    ctx.moveTo(x1 + this._getOffset(-halfOffset, halfOffset), y1 + this._getOffset(-halfOffset, halfOffset));
    ctx.bezierCurveTo(midDispX + x1 + (x2 - x1) * divergePoint + this._getOffset(-halfOffset, halfOffset),
      midDispY + y1 + (y2 - y1) * divergePoint + this._getOffset(-halfOffset, halfOffset),
      midDispX + x1 + 2 * (x2 - x1) * divergePoint + this._getOffset(-halfOffset, halfOffset),
      midDispY + y1 + 2 * (y2 - y1) * divergePoint + this._getOffset(-halfOffset, halfOffset),
      x2 + this._getOffset(-halfOffset, halfOffset),
      y2 + this._getOffset(-halfOffset, halfOffset));
  }

  _hachureFillShape(xCoords, yCoords) {
    const ctx = this.ctx;
    if (xCoords && yCoords && xCoords.length && yCoords.length) {
      var left = xCoords[0];
      var right = xCoords[0];
      var top = yCoords[0];
      var bottom = yCoords[0];
      for (let i = 1; i < xCoords.length; i++) {
        left = Math.min(left, xCoords[i]);
        right = Math.max(right, xCoords[i]);
        top = Math.min(top, yCoords[i]);
        bottom = Math.max(bottom, yCoords[i]);
      }

      var angle = this.hachureAngle;
      var gap = this.hachureGap;
      if (gap < 0) {
        gap = this.lineWidth * 4;
      }
      gap = Math.max(gap, 0.1);
      var fweight = this.fillWeight;
      if (fweight < 0) {
        fweight = this.lineWidth / 2;
      }

      const radPerDeg = Math.PI / 180;
      var hachureAngle = (angle % 180) * radPerDeg;
      var cosAngle = Math.cos(hachureAngle);
      var sinAngle = Math.sin(hachureAngle);
      var tanAngle = Math.tan(hachureAngle);

      ctx.save();
      ctx.strokeStyle = this.fillStyle;
      ctx.lineWidth = fweight;

      var it = new RoughHachureIterator(top - 1, bottom + 1, left - 1, right + 1, gap, sinAngle, cosAngle, tanAngle);
      var rectCoords;
      while ((rectCoords = it.getNextLine()) != null) {
        var lines = this._getIntersectingLines(rectCoords, xCoords, yCoords);
        for (let i = 0; i < lines.length; i++) {
          if (i < (lines.length - 1)) {
            let p1 = lines[i];
            let p2 = lines[i + 1];
            this._drawLine(p1[0], p1[1], p2[0], p2[1]);
          }
        }
      }

      ctx.restore();
    }
  }

  _getIntersectingLines(lineCoords, xCoords, yCoords) {
    let intersections = [];
    var s1 = new RoughSegment(lineCoords[0], lineCoords[1], lineCoords[2], lineCoords[3]);
    for (var i = 0; i < xCoords.length; i++) {
      let s2 = new RoughSegment(xCoords[i], yCoords[i], xCoords[(i + 1) % xCoords.length], yCoords[(i + 1) % xCoords.length]);
      if (s1.compare(s2) == RoughSegmentRelation.INTERSECTS) {
        intersections.push([s1.xi, s1.yi]);
      }
    }
    return intersections;
  }
}