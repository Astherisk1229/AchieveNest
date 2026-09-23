<?php

namespace App\Controllers\Api;

use App\Services\AuthenticatedActorService;
use App\Services\EventSourceRecordBridgeService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use RuntimeException;

final class EventCertificateCandidateController extends Controller
{
    use ResponseTrait;
    public function __construct(private ?AuthenticatedActorService $actors=null,private ?EventSourceRecordBridgeService $bridge=null) { $this->actors??=new AuthenticatedActorService(); $this->bridge??=new EventSourceRecordBridgeService(); }
    public function options(): mixed { return $this->respond(null,204); }
    public function candidates(string $eventId): mixed { $actor=$this->actor();if(!$actor)return $this->unauthorized();if(!$this->authorized($actor))return $this->respond(['error'=>['code'=>'FORBIDDEN','message'=>'Organization moderator or OSAD authority required.']],403);try{return $this->respond(['data'=>['event_id'=>$eventId,'candidates'=>$this->bridge->candidates($eventId)]]);}catch(RuntimeException $e){return $this->respond(['error'=>['code'=>$e->getMessage(),'message'=>'Event certificate candidates are not available.']],503);} }
    public function resolve(string $eventId): mixed { $actor=$this->actor();if(!$actor)return $this->unauthorized();if(!$this->authorized($actor))return $this->respond(['error'=>['code'=>'FORBIDDEN','message'=>'Organization moderator or OSAD authority required.']],403);$json=$this->request->getJSON(true)?:[];try{return $this->respond(['data'=>['event_id'=>$eventId,'results'=>$this->bridge->resolve($eventId,(array)($json['student_ids']??[]),$actor['profile']['id'])]]);}catch(RuntimeException $e){return $this->respond(['error'=>['code'=>$e->getMessage(),'message'=>'Event source records could not be resolved.']],503);} }
    private function actor(): ?array{return $this->actors->resolveActor($this->request->getHeaderLine('Authorization'));}
    private function authorized(array $actor): bool{return (bool)array_intersect(['organization_moderator','osad_staff'],$actor['roles']??[]);}
    private function unauthorized(): mixed{return $this->respond(['error'=>['code'=>'UNAUTHORIZED','message'=>'Valid active authenticated session required.']],401);}
}
