module.exports = {
  roomIndex: {
    'H-867': 'Hall_F8_room_291',
    'H-865': 'Hall_F8_room_292',
    'H-801': 'Hall_F8_room_329',
    'H-851-1': 'Hall_F8_room_300',
    'H-929': 'Hall_F9_room_202',
    'H-933-11': 'Hall_F9_room_207',
    'H-23': 'Hall_F1_room_44',
    'H-131': 'Hall_F1_room_47',
    'H-800': 'Hall_F8_oriented_start',
    'H-802': 'Hall_F8_oriented_end'
  },
  poiIndex: {
    elevator_door: [
      { nodeId: 'Hall_F8_elevator_door_12', label: 'H-elevator2', floor: 8, x: 682, y: 752 },
      { nodeId: 'Hall_F8_elevator_door_13', label: 'H-elevator1', floor: 8, x: 752, y: 754 },
      { nodeId: 'Hall_F9_elevator_door_10', label: 'H-elevator2', floor: 9, x: 1366, y: 1309 },
      { nodeId: 'Hall_F9_elevator_door_11', label: 'H-elevator1', floor: 9, x: 1296, y: 1308 },
    ],
    stair_landing: []
  },
  nodes: [
    { id: 'Hall_F8_room_291', data: { type: 'room', buildingId: 'Hall', floor: 8, x: 138, y: 210, label: 'H-867', accessible: true } },
    { id: 'Hall_F8_room_292', data: { type: 'room', buildingId: 'Hall', floor: 8, x: 115, y: 367, label: 'H-865', accessible: true } },
    { id: 'Hall_F8_room_300', data: { type: 'room', buildingId: 'Hall', floor: 8, x: 200, y: 400, label: 'H-851-1', accessible: true } },
    { id: 'Hall_F8_room_329', data: { type: 'room', buildingId: 'Hall', floor: 8, x: 300, y: 500, label: 'H-801', accessible: true } },
    { id: 'Hall_F9_room_202', data: { type: 'room', buildingId: 'Hall', floor: 9, x: 100, y: 200, label: 'H-929', accessible: true } },
    { id: 'Hall_F9_room_207', data: { type: 'room', buildingId: 'Hall', floor: 9, x: 150, y: 250, label: 'H-933-11', accessible: true } },
    { id: 'Hall_F1_room_44', data: { type: 'room', buildingId: 'Hall', floor: 1, x: 100, y: 200, label: 'H-23', accessible: true } },
    { id: 'Hall_F1_room_47', data: { type: 'room', buildingId: 'Hall', floor: 1, x: 150, y: 250, label: 'H-131', accessible: true } },
    { id: 'Hall_F8_elevator_door_12', data: { type: 'elevator_door', buildingId: 'Hall', floor: 8, x: 682, y: 752, label: 'H-elevator2', accessible: true } },
    { id: 'Hall_F8_elevator_door_13', data: { type: 'elevator_door', buildingId: 'Hall', floor: 8, x: 752, y: 754, label: 'H-elevator1', accessible: true } },
    { id: 'Hall_F9_elevator_door_10', data: { type: 'elevator_door', buildingId: 'Hall', floor: 9, x: 1366, y: 1309, label: 'H-elevator2', accessible: true } },
    { id: 'Hall_F9_elevator_door_11', data: { type: 'elevator_door', buildingId: 'Hall', floor: 9, x: 1296, y: 1308, label: 'H-elevator1', accessible: true } },
    
    { id: 'Hall_F8_oriented_start', data: { type: 'room', buildingId: 'Hall', floor: 8, x: 800, y: 800, label: 'H-800', accessible: true } },
    { id: 'Hall_F8_oriented_end', data: { type: 'room', buildingId: 'Hall', floor: 8, x: 900, y: 800, label: 'H-802', accessible: true } },
    
    { id: 'Hall_F8_escalator_8', data: { type: 'stair_landing', buildingId: 'Hall', floor: 8, x: 500, y: 500, accessible: false } },
    { id: 'Hall_F9_escalator_9', data: { type: 'stair_landing', buildingId: 'Hall', floor: 9, x: 500, y: 500, accessible: false } }
  ],
  links: [
    { fromId: 'Hall_F8_room_291', toId: 'Hall_F8_room_292', data: { type: 'hallway', weight: 100, accessible: true } },
    { fromId: 'Hall_F8_room_292', toId: 'Hall_F8_room_300', data: { type: 'hallway', weight: 100, accessible: true } },
    { fromId: 'Hall_F8_room_300', toId: 'Hall_F8_room_329', data: { type: 'hallway', weight: 100, accessible: true } },
    { fromId: 'Hall_F8_room_292', toId: 'Hall_F8_room_291', data: { type: 'hallway', weight: 100, accessible: true } },
    { fromId: 'Hall_F8_room_300', toId: 'Hall_F8_room_292', data: { type: 'hallway', weight: 100, accessible: true } },
    { fromId: 'Hall_F8_room_329', toId: 'Hall_F8_room_300', data: { type: 'hallway', weight: 100, accessible: true } },

    { fromId: 'Hall_F8_oriented_start', toId: 'Hall_F8_oriented_end', data: { type: 'hallway', weight: 100, accessible: true, oriented: true } },
    { fromId: 'Hall_F8_oriented_end', toId: 'Hall_F8_oriented_start', data: { type: 'hallway', weight: 100, accessible: true } },
    
    { fromId: 'Hall_F8_room_291', toId: 'Hall_F8_oriented_start', data: { type: 'hallway', weight: 100, accessible: true } },
    { fromId: 'Hall_F8_oriented_start', toId: 'Hall_F8_room_291', data: { type: 'hallway', weight: 100, accessible: true } },

    { fromId: 'Hall_F8_escalator_8', toId: 'Hall_F9_escalator_9', data: { type: 'stair', weight: 100, accessible: false } },
    { fromId: 'Hall_F9_escalator_9', toId: 'Hall_F8_escalator_8', data: { type: 'stair', weight: 100, accessible: false } },
    
    { fromId: 'Hall_F8_room_291', toId: 'Hall_F8_escalator_8', data: { type: 'hallway', weight: 100, accessible: true } },
    { fromId: 'Hall_F8_escalator_8', toId: 'Hall_F8_room_291', data: { type: 'hallway', weight: 100, accessible: true } },
    { fromId: 'Hall_F9_room_202', toId: 'Hall_F9_escalator_9', data: { type: 'hallway', weight: 100, accessible: true } },
    { fromId: 'Hall_F9_escalator_9', toId: 'Hall_F9_room_202', data: { type: 'hallway', weight: 100, accessible: true } },

    { fromId: 'Hall_F8_elevator_door_12', toId: 'Hall_F9_elevator_door_10', data: { type: 'elevator', weight: 100, accessible: true } },
    { fromId: 'Hall_F9_elevator_door_10', toId: 'Hall_F8_elevator_door_12', data: { type: 'elevator', weight: 100, accessible: true } },
    
    { fromId: 'Hall_F8_room_291', toId: 'Hall_F8_elevator_door_12', data: { type: 'hallway', weight: 100, accessible: true } },
    { fromId: 'Hall_F8_elevator_door_12', toId: 'Hall_F8_room_291', data: { type: 'hallway', weight: 100, accessible: true } },
    { fromId: 'Hall_F9_room_202', toId: 'Hall_F9_elevator_door_10', data: { type: 'hallway', weight: 100, accessible: true } },
    { fromId: 'Hall_F9_elevator_door_10', toId: 'Hall_F9_room_202', data: { type: 'hallway', weight: 100, accessible: true } }
  ]
};
