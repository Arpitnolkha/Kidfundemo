export type JungleSceneId =
  | 'scene1'
  | 'scene2'
  | 'scene3'
  | 'scene4'
  | 'scene5'
  | 'scene6'
  | 'scene7';

export type JungleHotspot = {
  id: string;
  label: string;
  type: 'entity' | 'navigation';
  x: number;
  y: number;
  width: number;
  height: number;
  entityId?: string;
  targetScene?: JungleSceneId;
  rounded?: string;
};

export type JungleSceneDefinition = {
  id: JungleSceneId;
  name: string;
  image: string;
  nextSceneId?: JungleSceneId;
  hotspots: JungleHotspot[];
};
