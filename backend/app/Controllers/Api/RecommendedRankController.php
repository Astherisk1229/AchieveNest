<?php
namespace App\Controllers\Api;
use App\Services\AuthorizationService;
use App\Services\RecommendedRankService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use InvalidArgumentException;
use Throwable;
class RecommendedRankController extends Controller
{
 use ResponseTrait;
 public function __construct(private ?AuthorizationService $authz=null,private ?RecommendedRankService $service=null){$this->authz??=new AuthorizationService();$this->service??=new RecommendedRankService();}
 public function options():mixed{return$this->respond(null,204);}
 public function suggest(string $evaluationId):mixed{$a=$this->actor();if(!$a)return$this->respond(['error'=>['code'=>'UNAUTHORIZED','message'=>'Authentication required.']],401);try{return$this->respondCreated(['data'=>$this->service->suggest($a,$evaluationId)]);}catch(Throwable $e){return$this->error($e);}}
 public function confirm(string $decisionId):mixed{$a=$this->actor();if(!$a)return$this->respond(['error'=>['code'=>'UNAUTHORIZED','message'=>'Authentication required.']],401);$j=(array)($this->request->getJSON(true)??[]);try{return$this->respond(['data'=>$this->service->confirm($a,$decisionId,(string)($j['rank_code']??''),$j['justification']??null)]);}catch(Throwable $e){return$this->error($e);}}
 private function actor():?array{return$this->authz->resolveActor($this->request->getHeaderLine('Authorization'));}
 private function error(Throwable $e):mixed{return$this->respond(['error'=>['code'=>$e->getMessage(),'message'=>[ 'EVALUATION_ELIGIBILITY_NOT_MET'=>'This personnel did not meet the rank conditions when the portfolio was submitted.','EVALUATION_ELIGIBILITY_UNREADABLE'=>'The eligibility record saved with this evaluation is incomplete or unreadable.','EVALUATION_ANNUAL_REVIEW_NOT_MET'=>'Both annual review ratings must be confirmed as passing before rank recommendation.','EVALUATION_RESEARCH_OUTPUT_NOT_MET'=>'A submitted Research Output with clean evidence is required before rank recommendation.','PERSONNEL_TYPE_NOT_CONFIRMED'=>'HR must explicitly classify this person as Teaching before rank progression.','CONFIRMED_RANK_APPLIED_FOR_MISSING'=>'Confirm the Rank Applied For before recommending a rank.','PASSING_THRESHOLD_MISSING_OR_AMBIGUOUS'=>'The criteria version used for this evaluation has no single passing score.','CURRENT_PLACEMENT_MISSING'=>'This personnel has no current rank placement from verified credentials.'][$e->getMessage()]??'Recommended Rank action could not be completed.']],$e instanceof InvalidArgumentException?422:409);}
}
